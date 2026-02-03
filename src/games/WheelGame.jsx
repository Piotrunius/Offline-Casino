import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// FIXED: Wheel segments with proper arrangement - pointer at TOP (12 o'clock)
const SEGMENTS = [
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 1.5, color: '#16213e', label: '1.5x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 2, color: '#0f3460', label: '2x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 1.2, color: '#16213e', label: '1.2x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 3, color: '#e94560', label: '3x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 1.5, color: '#16213e', label: '1.5x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 5, color: '#ff6b6b', label: '5x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 1.2, color: '#16213e', label: '1.2x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 2, color: '#0f3460', label: '2x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 10, color: '#ffd700', label: '10x' },
  { mult: 0, color: '#1a1a2e', label: '0x' },
  { mult: 1.5, color: '#16213e', label: '1.5x' },
];

const HOUSE_EDGE = 0.05;

export default function WheelGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(() => Math.floor(state.balance * 0.05) || 10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const segAngle = 360 / SEGMENTS.length;

  const drawWheel = useCallback((rot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    // Draw wheel
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = (i * segAngle - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * segAngle - 90) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.translate(r * 0.7, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = seg.mult > 0 ? '#fff' : '#666';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // FIXED: Pointer at TOP (12 o'clock position) - pointing DOWN into wheel
    ctx.beginPath();
    ctx.moveTo(cx, 15);
    ctx.lineTo(cx - 12, 0);
    ctx.lineTo(cx + 12, 0);
    ctx.closePath();
    ctx.fillStyle = '#00f5ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [segAngle]);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'wheel')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Weighted random selection
    const weights = SEGMENTS.map(s => s.mult === 0 ? 3 : s.mult >= 10 ? 0.1 : s.mult >= 5 ? 0.3 : 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let resultIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { resultIdx = i; break; }
    }

    const resultSeg = SEGMENTS[resultIdx];

    // FIXED: Calculate rotation so pointer at TOP points to winning segment
    // Pointer is at 12 o'clock (top), which is -90 degrees or 270 degrees
    // We need the CENTER of the winning segment to align with the pointer
    const segmentCenterAngle = resultIdx * segAngle + segAngle / 2;
    const spins = 5 + Math.random() * 3;
    // To align segment center with top pointer, we rotate so that:
    // -segmentCenterAngle + offset lands segment at top
    // Since wheel rotates clockwise visually, we add rotation
    const targetRotation = spins * 360 + (360 - segmentCenterAngle);

    const startRotation = rotation % 360;
    const duration = state.settings.fastMode ? 3000 : 6000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentRotation = startRotation + targetRotation * eased;

      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);

        if (resultSeg.mult > 0) {
          const win = bet * resultSeg.mult;
          addWin(win, bet, 'wheel', resultSeg.mult);
          audio.playWin();
          setResult({ won: true, mult: resultSeg.mult, profit: win - bet });
        } else {
          addWin(0, bet, 'wheel', 0);
          audio.playLose();
          setResult({ won: false, mult: 0, profit: -bet });
        }

        setHistory(h => [{ mult: resultSeg.mult, won: resultSeg.mult > 0 }, ...h.slice(0, 4)]);
      }
    };

    animate();
  }, [spinning, bet, state.balance, state.settings.fastMode, rotation, placeBet, addWin, drawWheel, segAngle]);

  useEffect(() => {
    drawWheel(rotation);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-2">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} width={350} height={350} />
        </div>

        {result && (
          <div className={`text-center text-3xl font-bold mb-4 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
            {result.won ? `${result.mult}x — +$${result.profit.toFixed(2)}` : 'No Win'}
          </div>
        )}

        <button onClick={spin} disabled={spinning || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-xl disabled:opacity-50">
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} disabled={spinning} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Multipliers</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[...new Set(SEGMENTS.filter(s => s.mult > 0).map(s => s.mult))].sort((a, b) => a - b).map(m => (
              <div key={m} className="bg-gray-800 rounded px-2 py-1 text-center">
                <span className={m >= 5 ? 'text-yellow-400' : 'text-cyan-400'}>{m}x</span>
              </div>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult}x
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
