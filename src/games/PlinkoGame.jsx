import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const RISK_LEVELS = {
  low: {
    multipliers: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    colors: ['#22c55e', '#22c55e', '#4ade80', '#86efac', '#94a3b8', '#86efac', '#4ade80', '#22c55e', '#22c55e']
  },
  medium: {
    multipliers: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    colors: ['#eab308', '#eab308', '#facc15', '#fde047', '#94a3b8', '#fde047', '#facc15', '#eab308', '#eab308']
  },
  high: {
    multipliers: [29, 4, 1.5, 0.3, 0, 0.3, 1.5, 4, 29],
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

  // Calculate peg positions
  const getPegPositions = useCallback(() => {
    const pegs = [];
    const boardWidth = 100;
    const startY = 12;
    const endY = 75;
    const rowHeight = (endY - startY) / PEG_ROWS;

    for (let row = 0; row < PEG_ROWS; row++) {
      const numPegs = PEGS_PER_ROW(row);
      const spacing = boardWidth / (numPegs + 1);

      for (let col = 0; col < numPegs; col++) {
        pegs.push({
          x: spacing * (col + 1),
          y: startY + row * rowHeight,
          row
        });
      }
    }
    return pegs;
  }, []);

  const pegs = getPegPositions();

  const dropBall = useCallback(async () => {
    if (bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'plinko');
    if (!confirmed) return;

    audio.playBet();

    const ballId = ballIdRef.current++;
    const duration = state.settings?.fastMode ? 2000 : 3500;
    const startTime = Date.now();

    const multipliers = RISK_LEVELS[risk].multipliers;

    // Determine target slot
    let targetSlot;
    if (godMode) {
      const maxMult = Math.max(...multipliers);
      const highIndices = multipliers.map((m, i) => m === maxMult ? i : -1).filter(i => i !== -1);
      targetSlot = highIndices[Math.floor(Math.random() * highIndices.length)];
    } else {
      // Weighted random - center more likely
      const weights = [1, 2, 4, 8, 10, 8, 4, 2, 1];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      targetSlot = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          targetSlot = i;
          break;
        }
      }
    }

    // Generate path with physics simulation
    const path = [];
    let x = 50 + (Math.random() - 0.5) * 10;
    let y = 2;
    let vx = 0;
    let vy = 0;

    const gravity = 0.15;
    const friction = 0.98;
    const bounceEnergy = 0.7;

    // Calculate target x based on slot
    const targetX = ((targetSlot + 0.5) / multipliers.length) * 100;
    const xBias = godMode ? (targetX - 50) * 0.008 : 0;

    path.push({ x, y });

    // Simulate physics
    const steps = 200;
    for (let step = 0; step < steps; step++) {
      vy += gravity;
      vx *= friction;
      vy *= friction;

      // Add slight bias towards target in god mode
      vx += xBias;

      x += vx;
      y += vy;

      // Bounce off walls
      if (x < 5) { x = 5; vx = Math.abs(vx) * bounceEnergy; }
      if (x > 95) { x = 95; vx = -Math.abs(vx) * bounceEnergy; }

      // Check peg collisions
      for (const peg of pegs) {
        const dx = x - peg.x;
        const dy = y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          // Collision! Bounce off peg
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(vx * vx + vy * vy);

          // Random bounce direction with some physics
          const bounceAngle = angle + (Math.random() - 0.5) * 0.8;
          vx = Math.cos(bounceAngle) * speed * bounceEnergy + (Math.random() - 0.5) * 1.5;
          vy = Math.abs(Math.sin(bounceAngle) * speed * bounceEnergy) + 0.5;

          // Push ball away from peg
          x = peg.x + Math.cos(angle) * 5;
          y = peg.y + Math.sin(angle) * 5;
        }
      }

      // Record position every few steps
      if (step % 2 === 0) {
        path.push({ x: Math.max(3, Math.min(97, x)), y: Math.min(88, y) });
      }

      // Stop if reached bottom
      if (y >= 88) break;
    }

    // Final position - ensure it lands in a slot
    const finalX = Math.max(3, Math.min(97, x));
    path.push({ x: finalX, y: 92 });

    // Determine which slot the ball lands in
    const slotWidth = 100 / multipliers.length;
    let finalSlot = Math.floor(finalX / slotWidth);
    finalSlot = Math.max(0, Math.min(multipliers.length - 1, finalSlot));

    // In god mode, force the correct slot
    if (godMode) {
      finalSlot = targetSlot;
      path[path.length - 1].x = (targetSlot + 0.5) * slotWidth;
    }

    const mult = multipliers[finalSlot];

    const newBall = {
      id: ballId,
      path,
      currentIndex: 0,
      startTime,
      duration,
      mult,
      slot: finalSlot,
      bet: bet,
      risk
    };

    setBalls(prev => [...prev, newBall]);

    // Animation loop
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Easing for more natural movement
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const currentIndex = Math.min(Math.floor(easedProgress * path.length), path.length - 1);

      setBalls(prev => prev.map(b => {
        if (b.id !== ballId) return b;
        return { ...b, currentIndex, currentPos: path[currentIndex] };
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ball finished
        setBalls(prev => prev.filter(b => b.id !== ballId));
        setLastHitSlot(finalSlot);

        setTimeout(() => setLastHitSlot(null), 500);

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

    requestAnimationFrame(animate);
  }, [bet, state.balance, risk, godMode, state.settings?.fastMode, placeBet, addWin, pegs]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const currentMultipliers = RISK_LEVELS[risk].multipliers;
  const currentColors = RISK_LEVELS[risk].colors;

  return (
    <div className="h-full flex gap-4 p-3">
      {/* Game Area - Made larger */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a15] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center">
        {/* Plinko Board */}
        <div className="relative w-full max-w-xl aspect-[4/5] bg-gradient-to-b from-[#1a1a2e] to-[#16162a] rounded-2xl overflow-hidden border border-cyan-900/30 shadow-2xl">
          {/* Glow effect at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-cyan-500/20 blur-2xl rounded-full" />

          {/* Drop zone indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-cyan-500/50 border-dashed animate-pulse" />

          {/* Pegs */}
          {pegs.map((peg, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg"
              style={{
                left: `calc(${peg.x}% - 6px)`,
                top: `calc(${peg.y}% - 6px)`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            />
          ))}

          {/* Active Balls */}
          {balls.map(ball => {
            const pos = ball.currentPos || ball.path[0];
            return (
              <div
                key={ball.id}
                className="absolute w-5 h-5 rounded-full z-20"
                style={{
                  left: `calc(${pos.x}% - 10px)`,
                  top: `calc(${pos.y}% - 10px)`,
                  background: 'radial-gradient(circle at 30% 30%, #67e8f9, #06b6d4, #0891b2)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                  transition: 'left 0.03s linear, top 0.03s linear'
                }}
              />
            );
          })}

          {/* Multiplier Slots */}
          <div className="absolute bottom-0 left-0 right-0 flex px-1 pb-2">
            {currentMultipliers.map((mult, i) => (
              <div
                key={i}
                className={`flex-1 mx-0.5 py-2.5 rounded-lg text-center font-bold transition-all duration-300 ${
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
                  {mult}×
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Stats */}
        {results.length > 0 && (
          <div className={`mt-4 px-6 py-3 rounded-xl font-bold text-lg ${
            totalProfit >= 0
              ? 'bg-gradient-to-r from-green-900/60 to-green-800/40 text-green-400 border border-green-600/30'
              : 'bg-gradient-to-r from-red-900/60 to-red-800/40 text-red-400 border border-red-600/30'
          }`}>
            Session: {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="w-80 bg-[#0a0a15] rounded-2xl p-4 flex flex-col gap-4 border border-gray-800/50">
        {/* Bet Amount */}
        <div>
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
              { label: '½', action: () => handleBetChange(Math.floor(bet / 2)) },
              { label: '2×', action: () => handleBetChange(bet * 2) },
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
        <div>
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
        <div className="bg-black/40 rounded-xl p-3 border border-gray-800/50">
          <div className="text-xs text-gray-500 uppercase font-bold mb-2">Possible Multipliers</div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {[...new Set(currentMultipliers)].sort((a, b) => b - a).map((m, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  m >= 10 ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' :
                  m >= 1 ? 'bg-gray-700/80 text-gray-200' :
                  'bg-red-900/50 text-red-400'
                }`}
              >
                {m}×
              </span>
            ))}
          </div>
        </div>

        {/* Drop Button */}
        <button
          onClick={dropBall}
          disabled={bet <= 0 || bet > state.balance}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            bet <= 0 || bet > state.balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-600/30 hover:shadow-cyan-500/40 active:scale-95'
          }`}
        >
          🎱 DROP BALL {balls.length > 0 && `(${balls.length} active)`}
        </button>

        {/* Multi-drop info */}
        <div className="text-center text-xs text-gray-500">
          Click multiple times for multiple balls!
        </div>

        {/* Results History */}
        {results.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Recent Drops</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
              {results.map((r) => (
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
                  <span className="font-bold">{r.mult}×</span>
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
