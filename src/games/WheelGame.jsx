import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SEGMENTS = [
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '1.5x', mult: 1.5, color: '#00d4ff' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '2x', mult: 2, color: '#00ff88' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '3x', mult: 3, color: '#ffee00' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '1.2x', mult: 1.2, color: '#00aaff' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '5x', mult: 5, color: '#ff8800' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '1.5x', mult: 1.5, color: '#00d4ff' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '10x', mult: 10, color: '#ff3366' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '2x', mult: 2, color: '#00ff88' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '50x', mult: 50, color: '#ff00ff' },
  { label: 'LOSE', mult: 0, color: '#1a1a2e' },
  { label: '1.5x', mult: 1.5, color: '#00d4ff' },
];

export default function WheelGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [displaySegment, setDisplaySegment] = useState(SEGMENTS[1]);
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animRef = useRef(null);

  const segAngle = 360 / SEGMENTS.length;

  const drawWheel = useCallback((rotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 30;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 245, 255, 0.1)';
    ctx.fill();

    // Draw segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);

    SEGMENTS.forEach((seg, i) => {
      const start = (i * segAngle - 90) * Math.PI / 180;
      const end = ((i + 1) * segAngle - 90) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();

      // Fill
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      if (seg.mult === 0) {
        grad.addColorStop(0, '#2a2a3e');
        grad.addColorStop(1, '#1a1a2e');
      } else {
        grad.addColorStop(0, seg.color);
        grad.addColorStop(1, seg.color + '80');
      }
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(start + (segAngle / 2) * Math.PI / 180);
      ctx.translate(r * 0.72, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = seg.mult === 0 ? '#555' : '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer at top
    ctx.beginPath();
    ctx.moveTo(cx, 15);
    ctx.lineTo(cx - 15, 40);
    ctx.lineTo(cx + 15, 40);
    ctx.closePath();
    ctx.fillStyle = '#00f5ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [segAngle]);

  // Get segment at pointer (top)
  const getSegmentAtPointer = (rotation) => {
    const norm = ((rotation % 360) + 360) % 360;
    const idx = Math.floor((360 - norm + segAngle / 2) / segAngle) % SEGMENTS.length;
    return SEGMENTS[idx];
  };

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'wheel')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Determine result with weighted probability
    let resultIdx = 0;
    const rand = Math.random() * 100;
    let cum = 0;
    const weights = SEGMENTS.map(s => s.mult === 0 ? 10 : 80 / s.mult);
    const total = weights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < SEGMENTS.length; i++) {
      cum += (weights[i] / total) * 100;
      if (rand <= cum) {
        resultIdx = i;
        break;
      }
    }

    const resultSeg = SEGMENTS[resultIdx];

    // Calculate final rotation to land on this segment
    const spins = 5 + Math.random() * 2;
    const targetAngle = resultIdx * segAngle + segAngle / 2;
    const finalRotation = rotationRef.current + spins * 360 + (360 - targetAngle);

    const startRotation = rotationRef.current;
    const totalRotation = finalRotation - startRotation;
    const duration = state.settings.fastMode ? 4000 : 7000;
    const startTime = Date.now();
    let lastTickSeg = -1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentRotation = startRotation + totalRotation * eased;

      rotationRef.current = currentRotation;
      drawWheel(currentRotation);

      // Update display and play tick
      const currentSeg = getSegmentAtPointer(currentRotation);
      setDisplaySegment(currentSeg);

      const currentSegIdx = SEGMENTS.indexOf(currentSeg);
      if (currentSegIdx !== lastTickSeg && progress < 0.9) {
        audio.playTick();
        lastTickSeg = currentSegIdx;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Done - use the predetermined result
        setSpinning(false);
        setDisplaySegment(resultSeg);

        if (resultSeg.mult > 0) {
          const winAmount = bet * resultSeg.mult;
          addWin(winAmount, bet, 'wheel', resultSeg.mult);
          audio.playWin();
          setResult({ won: true, segment: resultSeg, profit: winAmount - bet });
        } else {
          addWin(0, bet, 'wheel', 0);
          audio.playLose();
          setResult({ won: false, segment: resultSeg, profit: -bet });
        }

        setHistory(h => [resultSeg, ...h.slice(0, 19)]);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, bet, state.balance, state.settings.fastMode, segAngle, placeBet, addWin, drawWheel]);

  useEffect(() => {
    drawWheel(0);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawWheel]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Current segment display */}
        <div className="text-center mb-4">
          <div className={`inline-block px-6 py-3 rounded-xl text-2xl font-black`}
            style={{ backgroundColor: displaySegment.color + '30', color: displaySegment.mult > 0 ? displaySegment.color : '#666' }}>
            {displaySegment.label}
          </div>
        </div>

        <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-md mx-auto" />

        {result && (
          <div className="text-center mt-4">
            <div className={`text-4xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 justify-center">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: h.color + '30', color: h.mult > 0 ? h.color : '#666' }}>
                {h.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={spin} disabled={spinning}
          buttonText={spinning ? 'SPINNING...' : 'SPIN'} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Multipliers</div>
          <div className="grid grid-cols-3 gap-2">
            {[...new Set(SEGMENTS.filter(s => s.mult > 0).map(s => s.mult))].sort((a, b) => a - b).map(m => (
              <div key={m} className="text-center py-2 rounded-lg bg-gray-800/50 text-sm font-bold text-cyan-400">
                {m}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
