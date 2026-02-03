import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

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

export default function WheelGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const segAngle = 360 / SEGMENTS.length;

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'wheel')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Pick winning segment
    const winIdx = Math.floor(Math.random() * SEGMENTS.length);
    const segment = SEGMENTS[winIdx];
    const mult = segment.mult;

    // Calculate rotation to land on winning segment
    // Pointer is at TOP (270 degrees in standard coords, or -90)
    // Segment 0 starts at top, going clockwise
    const segmentCenter = winIdx * segAngle + segAngle / 2;
    // We need to rotate so that segment center is at top (0 degrees visual)
    const targetAngle = 360 - segmentCenter;
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + spins * 360 + targetAngle + Math.random() * (segAngle * 0.6) - segAngle * 0.3;

    const duration = state.settings.fastMode ? 2000 : 4000;
    const start = Date.now();
    const startRot = rotation;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setRotation(startRot + (finalRotation - startRot) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setRotation(finalRotation % 360 + 360 * 5); // Normalize

        const winAmount = bet * mult;
        setResult({ mult, win: winAmount });
        setHistory(h => [{ mult, win: winAmount > 0 }, ...h.slice(0, 4)]);

        if (mult > 0) {
          addWin(winAmount, bet, 'wheel', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'wheel', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [spinning, bet, state.balance, rotation, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col items-center justify-center relative">
        {/* Pointer at TOP */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-cyan-400" />
        </div>

        {/* Wheel */}
        <svg viewBox="0 0 200 200" className="w-full max-w-[300px] max-h-[300px]">
          <g transform={`rotate(${rotation} 100 100)`}>
            {SEGMENTS.map((seg, i) => {
              const startAngle = (i * segAngle - 90) * Math.PI / 180;
              const endAngle = ((i + 1) * segAngle - 90) * Math.PI / 180;
              const x1 = 100 + 90 * Math.cos(startAngle);
              const y1 = 100 + 90 * Math.sin(startAngle);
              const x2 = 100 + 90 * Math.cos(endAngle);
              const y2 = 100 + 90 * Math.sin(endAngle);
              const largeArc = segAngle > 180 ? 1 : 0;

              const midAngle = (startAngle + endAngle) / 2;
              const textX = 100 + 65 * Math.cos(midAngle);
              const textY = 100 + 65 * Math.sin(midAngle);

              return (
                <g key={i}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke="#333"
                    strokeWidth="1"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={seg.mult > 0 ? '#fff' : '#555'}
                    fontSize="8"
                    fontWeight="bold"
                    transform={`rotate(${i * segAngle + segAngle / 2} ${textX} ${textY})`}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
          </g>
          {/* Center */}
          <circle cx="100" cy="100" r="15" fill="#0a0a12" stroke="#00f5ff" strokeWidth="2" />
        </svg>

        {/* Result */}
        {result && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.mult > 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-2xl font-black ${result.mult > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.mult}x → ${result.win.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={spinning}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={spinning} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={spinning} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={spinning} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={spinning} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Multipliers Info */}
          <div className="bg-black/30 rounded-lg p-2 text-xs">
            <div className="text-gray-500 uppercase mb-1">Possible Wins</div>
            <div className="grid grid-cols-2 gap-1">
              {[10, 5, 3, 2, 1.5, 1.2].map(m => (
                <div key={m} className="flex justify-between">
                  <span className="text-gray-400">{m}x</span>
                  <span className="text-green-400">${(bet * m).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={spinning || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? 'SPINNING...' : 'SPIN WHEEL'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">History</div>
              <div className="flex gap-1">
                {history.map((h, i) => (
                  <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.win ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {h.mult}x
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
