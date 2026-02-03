import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const RISK_LEVELS = {
  low: {
    multipliers: [1.5, 1.2, 1.1, 0.9, 0.5, 0.9, 1.1, 1.2, 1.5],
    colors: ['#22c55e', '#22c55e', '#4ade80', '#86efac', '#94a3b8', '#86efac', '#4ade80', '#22c55e', '#22c55e']
  },
  medium: {
    multipliers: [3, 1.5, 0.8, 0.4, 0.2, 0.4, 0.8, 1.5, 3],
    colors: ['#eab308', '#eab308', '#facc15', '#fde047', '#94a3b8', '#fde047', '#facc15', '#eab308', '#eab308']
  },
  high: {
    multipliers: [10, 2, 0.5, 0.2, 0, 0.2, 0.5, 2, 10],
    colors: ['#ef4444', '#ef4444', '#f87171', '#fca5a5', '#94a3b8', '#fca5a5', '#f87171', '#ef4444', '#ef4444']
  }
};

const PEG_ROWS = 8;
const PEGS_PER_ROW = (row) => row + 3;

export default function PlinkoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [risk, setRisk] = useState('medium');
  const [balls, setBalls] = useState([]);
  const [results, setResults] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [lastHitSlot, setLastHitSlot] = useState(null);
  const ballIdRef = useRef(0);

  const godMode = state.adminSettings?.godMode || state.adminSettings?.gameSettings?.plinko?.forceHighMultiplier;

  // Calculate peg positions once - PYRAMID LAYOUT (centered)
  const pegs = (() => {
    const result = [];
    const boardWidth = 100;
    const startY = 12;
    const endY = 75;
    const rowHeight = (endY - startY) / PEG_ROWS;

    // Last row has max pegs - use that as reference for spacing
    const maxPegs = PEGS_PER_ROW(PEG_ROWS - 1);
    const pegSpacing = boardWidth / (maxPegs + 1);

    for (let row = 0; row < PEG_ROWS; row++) {
      const numPegs = PEGS_PER_ROW(row);
      // Calculate offset to center the row
      const rowWidth = (numPegs - 1) * pegSpacing;
      const startX = (boardWidth - rowWidth) / 2;

      for (let col = 0; col < numPegs; col++) {
        result.push({
          x: startX + col * pegSpacing,
          y: startY + row * rowHeight,
          row
        });
      }
    }
    return result;
  })();

  const dropBall = useCallback(async () => {
    if (bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'plinko');
    if (!confirmed) return;

    audio.playBet();

    const ballId = ballIdRef.current++;
    const duration = state.settings?.fastMode ? 1800 : 3000;
    const startTime = Date.now();

    const multipliers = RISK_LEVELS[risk].multipliers;

    // Generate the path upfront (pre-calculate entire trajectory)
    const path = [];
    let x = 50 + (Math.random() - 0.5) * 8;
    let y = 2;

    // Determine final slot based on probability distribution
    let finalSlot;
    if (godMode) {
      const maxMult = Math.max(...multipliers);
      const highIndices = multipliers.map((m, i) => m === maxMult ? i : -1).filter(i => i !== -1);
      finalSlot = highIndices[Math.floor(Math.random() * highIndices.length)];
    } else {
      // Binomial distribution - center slots much more likely
      // This creates realistic plinko odds where edges are rare
      let leftCount = 0;
      for (let i = 0; i < PEG_ROWS; i++) {
        if (Math.random() < 0.5) leftCount++;
      }
      finalSlot = leftCount; // 0 to PEG_ROWS maps to 0 to 8
      finalSlot = Math.max(0, Math.min(8, finalSlot));
    }

    // Calculate target X for final slot
    const slotWidth = 100 / multipliers.length;
    const targetX = (finalSlot + 0.5) * slotWidth;

    // Generate smooth path towards target
    path.push({ x, y });

    const totalSteps = 60;
    for (let step = 1; step <= totalSteps; step++) {
      const progress = step / totalSteps;

      // Gradually move towards target X with some wobble
      const baseX = x + (targetX - x) * 0.03;
      const wobble = Math.sin(step * 0.5) * (1 - progress) * 3;
      x = baseX + wobble;
      x = Math.max(5, Math.min(95, x));

      // Y progresses smoothly
      y = 2 + progress * 90;

      path.push({ x, y });
    }

    // Ensure final position is in correct slot
    path[path.length - 1] = { x: targetX, y: 92 };

    const mult = multipliers[finalSlot];

    const newBall = {
      id: ballId,
      path,
      currentIndex: 0,
      mult,
      slot: finalSlot,
      bet: bet,
      risk
    };

    setBalls(prev => [...prev, newBall]);

    // Animation using pre-calculated path
    let animationFrame;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Use easeOutQuad for smooth deceleration
      const eased = 1 - (1 - progress) * (1 - progress);
      const currentIndex = Math.floor(eased * (path.length - 1));

      setBalls(prev => prev.map(b => {
        if (b.id !== ballId) return b;
        return { ...b, currentIndex };
      }));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Ball finished - clean up immediately
        setBalls(prev => prev.filter(b => b.id !== ballId));
        setLastHitSlot(finalSlot);

        setTimeout(() => setLastHitSlot(null), 400);

        const profit = mult > 0 ? (bet * mult) - bet : -bet;
        setTotalProfit(prev => prev + profit);

        setResults(prev => [{
          id: ballId,
          mult,
          slot: finalSlot,
          risk,
          profit,
          won: mult >= 1
        }, ...prev.slice(0, 9)]);

        if (mult > 0) {
          const winAmount = bet * mult;
          addWin(winAmount, bet, 'plinko', mult);
          if (mult >= 1) audio.playWin();
          else audio.playLose();
        } else {
          addWin(0, bet, 'plinko', 0);
          audio.playLose();
        }
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [bet, state.balance, risk, godMode, state.settings?.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const currentMultipliers = RISK_LEVELS[risk].multipliers;
  const currentColors = RISK_LEVELS[risk].colors;

  return (
    <div className="h-full flex gap-4 p-3 overflow-hidden">
      {/* Game Area */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a15] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center min-h-0">
        {/* Plinko Board */}
        <div className="relative w-full max-w-xl aspect-[4/5] bg-gradient-to-b from-[#1a1a2e] to-[#16162a] rounded-2xl overflow-hidden border border-cyan-900/30 shadow-2xl flex-shrink-0">
          {/* Glow effect at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-cyan-500/20 blur-2xl rounded-full" />

          {/* Drop zone indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-cyan-500/50 border-dashed animate-pulse" />

          {/* Pegs */}
          {pegs.map((peg, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-500"
              style={{
                left: `calc(${peg.x}% - 6px)`,
                top: `calc(${peg.y}% - 6px)`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            />
          ))}

          {/* Active Balls */}
          {balls.map(ball => {
            const pos = ball.path[ball.currentIndex] || ball.path[0];
            return (
              <div
                key={ball.id}
                className="absolute w-5 h-5 rounded-full z-20 will-change-transform"
                style={{
                  left: `calc(${pos.x}% - 10px)`,
                  top: `calc(${pos.y}% - 10px)`,
                  background: 'radial-gradient(circle at 30% 30%, #67e8f9, #06b6d4, #0891b2)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.7), 0 0 30px rgba(6, 182, 212, 0.3)'
                }}
              />
            );
          })}

          {/* Multiplier Slots */}
          <div className="absolute bottom-0 left-0 right-0 flex px-1 pb-2">
            {currentMultipliers.map((mult, i) => (
              <div
                key={i}
                className={`flex-1 mx-0.5 py-2.5 rounded-lg text-center font-bold transition-all duration-200 ${
                  lastHitSlot === i ? 'scale-110 ring-2 ring-white' : ''
                }`}
                style={{
                  backgroundColor: currentColors[i],
                  boxShadow: lastHitSlot === i
                    ? `0 0 20px ${currentColors[i]}, 0 0 40px ${currentColors[i]}`
                    : `0 4px 12px rgba(0,0,0,0.3)`,
                  transform: lastHitSlot === i ? 'scale(1.1) translateY(-4px)' : 'scale(1)'
                }}
              >
                <span className={`text-sm drop-shadow-lg ${mult >= 1 ? 'text-white' : 'text-gray-200'}`}>
                  {mult}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-80 bg-[#0a0a15] rounded-2xl p-4 flex flex-col gap-4 border border-gray-800/50 overflow-hidden">
        {/* Bet Amount */}
        <div className="flex-shrink-0">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              className="w-full bg-black/60 border border-cyan-900/50 rounded-xl py-3 pl-10 pr-4 text-white font-bold text-lg focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[
              { label: 'MIN', action: () => handleBetChange(1) },
              { label: '1/2', action: () => handleBetChange(Math.floor(bet / 2)) },
              { label: '2X', action: () => handleBetChange(bet * 2) },
              { label: 'MAX', action: () => handleBetChange(state.balance) }
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="py-2 rounded-lg text-sm font-bold bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700/50"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Level */}
        <div className="flex-shrink-0">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(RISK_LEVELS).map(([r]) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  risk === r
                    ? r === 'low'
                      ? 'bg-green-600 text-white border-green-400 shadow-lg shadow-green-600/30'
                      : r === 'medium'
                        ? 'bg-yellow-600 text-white border-yellow-400 shadow-lg shadow-yellow-600/30'
                        : 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30'
                    : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Multipliers Preview */}
        <div className="bg-black/40 rounded-xl p-3 border border-gray-800/50 flex-shrink-0">
          <div className="text-xs text-gray-500 uppercase font-bold mb-2">Possible Multipliers</div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {[...new Set(currentMultipliers)].sort((a, b) => b - a).map((m, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  m >= 3 ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' :
                  m >= 1 ? 'bg-gray-700/80 text-gray-200' :
                  'bg-red-900/50 text-red-400'
                }`}
              >
                {m}x
              </span>
            ))}
          </div>
        </div>

        {/* Drop Button */}
        <button
          onClick={dropBall}
          disabled={bet <= 0 || bet > state.balance}
          className={`py-4 rounded-xl font-bold text-lg transition-all flex-shrink-0 ${
            bet <= 0 || bet > state.balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-600/30 hover:shadow-cyan-500/40 active:scale-95'
          }`}
        >
          DROP BALL {balls.length > 0 && `(${balls.length} active)`}
        </button>

        {/* Multi-drop info */}
        <div className="text-center text-xs text-gray-500 flex-shrink-0">
          Click multiple times for multiple balls!
        </div>

        {/* Results History - Last 6 only */}
        {results.length > 0 && (
          <div className="flex-1 min-h-0">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Recent Drops</div>
            <div className="space-y-1.5">
              {results.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                    r.won
                      ? 'bg-green-900/30 text-green-400 border border-green-800/30'
                      : 'bg-red-900/30 text-red-400 border border-red-800/30'
                  }`}
                >
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                    r.risk === 'low' ? 'bg-green-900/50 text-green-400' :
                    r.risk === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {r.risk}
                  </span>
                  <span className="font-bold">{r.mult}x</span>
                  <span className="font-mono">{r.profit >= 0 ? '+' : ''}${r.profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
