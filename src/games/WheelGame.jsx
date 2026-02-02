import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const SEGMENTS = [
  { multiplier: 0, color: '#1a1a2e', label: '0x' },
  { multiplier: 1.2, color: '#3b82f6', label: '1.2x' },
  { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
  { multiplier: 0, color: '#1a1a2e', label: '0x' },
  { multiplier: 2, color: '#eab308', label: '2x' },
  { multiplier: 1.2, color: '#3b82f6', label: '1.2x' },
  { multiplier: 0, color: '#1a1a2e', label: '0x' },
  { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
  { multiplier: 3, color: '#f97316', label: '3x' },
  { multiplier: 1.2, color: '#3b82f6', label: '1.2x' },
  { multiplier: 0, color: '#1a1a2e', label: '0x' },
  { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
  { multiplier: 5, color: '#ef4444', label: '5x' },
  { multiplier: 1.2, color: '#3b82f6', label: '1.2x' },
  { multiplier: 0, color: '#1a1a2e', label: '0x' },
  { multiplier: 10, color: '#a855f7', label: '10x' },
];

export default function WheelGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const spin = useCallback(() => {
    if (bet <= 0 || bet > state.balance || spinning) return;
    if (!placeBet(bet, 'wheel')) return;

    setSpinning(true);
    setResult(null);

    // Determine winning segment
    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segment = SEGMENTS[winningIndex];

    // Calculate rotation
    const segmentAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - (winningIndex * segmentAngle) - (segmentAngle / 2);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + (spins * 360) + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      const winAmount = bet * segment.multiplier;

      if (segment.multiplier > 0) {
        addWin(winAmount, bet, 'wheel', segment.multiplier);
        setResult({ won: true, mult: segment.multiplier, profit: (winAmount - bet).toFixed(2) });
      } else {
        addWin(0, bet, 'wheel', 0);
        setResult({ won: false, mult: 0, profit: (-bet).toFixed(2) });
      }

      setHistory(h => [{ mult: segment.multiplier, won: segment.multiplier > 0 }, ...h.slice(0, 9)]);
      setSpinning(false);
    }, 5000);
  }, [bet, state.balance, spinning, rotation, placeBet, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Wheel */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="relative max-w-md mx-auto">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-cyan-400" />
          </div>

          {/* Wheel */}
          <div
            className="w-72 h-72 mx-auto rounded-full relative overflow-hidden border-4 border-[#2a2a45]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
            {SEGMENTS.map((seg, i) => {
              const angle = (360 / SEGMENTS.length);
              const rotate = i * angle;
              return (
                <div
                  key={i}
                  className="absolute w-1/2 h-1/2 origin-bottom-right"
                  style={{
                    transform: `rotate(${rotate}deg) skewY(${90 - angle}deg)`,
                    background: seg.color
                  }}
                />
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#0a0a14] border-4 border-[#2a2a45] flex items-center justify-center">
                <span className="text-2xl">🎡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-8">
            <div className={`text-4xl font-black mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.mult}x
            </div>
            <div className={`text-2xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[...new Set(SEGMENTS.map(s => s.multiplier))].sort((a, b) => a - b).map(mult => {
            const seg = SEGMENTS.find(s => s.multiplier === mult);
            return (
              <div key={mult} className="flex items-center gap-1 px-2 py-1 rounded bg-[#12121f]">
                <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                <span className="text-xs font-bold text-gray-400">{mult}x</span>
              </div>
            );
          })}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Spins</div>
            <div className="flex gap-2 flex-wrap justify-center">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.mult}x
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div>
        <BetControls
          bet={bet}
          setBet={setBet}
          onPlay={spin}
          disabled={spinning}
          balance={state.balance}
          buttonText={spinning ? 'SPINNING...' : 'SPIN WHEEL'}
        />
      </div>
    </div>
  );
}
