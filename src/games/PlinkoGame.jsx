import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const RISK_LEVELS = {
  low: { multipliers: [1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4], color: 'green' },
  medium: { multipliers: [3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3], color: 'yellow' },
  high: { multipliers: [10, 3, 1.5, 0.5, 0, 0.5, 1.5, 3, 10], color: 'red' }
};

const PEG_ROWS = 8;

export default function PlinkoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [risk, setRisk] = useState('medium');
  const [balls, setBalls] = useState([]);
  const [results, setResults] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const ballIdRef = useRef(0);

  const godMode = state.adminSettings?.godMode;

  const dropBall = useCallback(async () => {
    if (bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'plinko');
    if (!confirmed) return;

    audio.playBet();

    const ballId = ballIdRef.current++;
    const duration = state.settings.fastMode ? 1500 : 2500;
    const startTime = Date.now();

    const multipliers = RISK_LEVELS[risk].multipliers;
    const path = [{ x: 50, y: 0 }];
    let currentX = 50;

    let targetSlot;
    if (godMode) {
      const maxMult = Math.max(...multipliers);
      const highIndices = multipliers.map((m, i) => m === maxMult ? i : -1).filter(i => i !== -1);
      targetSlot = highIndices[Math.floor(Math.random() * highIndices.length)];
    } else {
      targetSlot = Math.floor(Math.random() * multipliers.length);
    }

    const targetX = (targetSlot / (multipliers.length - 1)) * 100;
    const xStep = (targetX - 50) / PEG_ROWS;

    for (let row = 1; row <= PEG_ROWS; row++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const randomOffset = direction * (3 + Math.random() * 4);

      if (godMode) {
        currentX += xStep + (Math.random() - 0.5) * 2;
      } else {
        currentX += randomOffset;
      }
      currentX = Math.max(5, Math.min(95, currentX));
      path.push({ x: currentX, y: (row / PEG_ROWS) * 100 });
    }

    const finalSlot = godMode ? targetSlot : Math.round((currentX / 100) * (multipliers.length - 1));
    const clampedSlot = Math.max(0, Math.min(multipliers.length - 1, finalSlot));
    const mult = multipliers[clampedSlot];

    const newBall = {
      id: ballId,
      path,
      currentPos: path[0],
      pathIndex: 0,
      startTime,
      duration,
      mult,
      slot: clampedSlot,
      bet: bet,
      risk
    };

    setBalls(prev => [...prev, newBall]);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentPathIndex = Math.min(Math.floor(progress * path.length), path.length - 1);

      setBalls(prev => prev.map(b => {
        if (b.id !== ballId) return b;
        return { ...b, currentPos: path[currentPathIndex], pathIndex: currentPathIndex };
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setBalls(prev => prev.filter(b => b.id !== ballId));

        const profit = mult > 0 ? (bet * mult) - bet : -bet;
        setTotalProfit(prev => prev + profit);

        setResults(prev => [{
          id: ballId,
          mult,
          slot: clampedSlot,
          risk,
          profit,
          won: mult >= 1
        }, ...prev.slice(0, 7)]);

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
  }, [bet, state.balance, risk, godMode, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const currentMultipliers = RISK_LEVELS[risk].multipliers;
  const riskColor = RISK_LEVELS[risk].color;

  return (
    <div className="h-full flex gap-3 p-2">
      {/* Game Area */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-3 flex flex-col items-center justify-center">
        {/* Plinko Board */}
        <div className="relative w-full max-w-sm aspect-square bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden">
          {/* Pegs */}
          {[...Array(PEG_ROWS)].map((_, row) => (
            <div
              key={row}
              className="absolute w-full flex justify-center gap-4"
              style={{ top: `${((row + 1) / (PEG_ROWS + 1)) * 80}%` }}
            >
              {[...Array(row + 3)].map((_, col) => (
                <div
                  key={col}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-400 to-gray-600"
                />
              ))}
            </div>
          ))}

          {/* All Active Balls */}
          {balls.map(ball => (
            <div
              key={ball.id}
              className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 z-10"
              style={{
                left: `calc(${ball.currentPos.x}% - 8px)`,
                top: `calc(${ball.currentPos.y * 0.8}% - 8px)`,
                boxShadow: '0 0 15px rgba(0, 245, 255, 0.6)',
                transition: 'left 0.05s linear, top 0.05s linear'
              }}
            />
          ))}

          {/* Multiplier Slots */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pb-1">
            {currentMultipliers.map((mult, i) => (
              <div
                key={i}
                className={`flex-1 mx-0.5 py-1.5 rounded text-center text-[10px] font-bold transition-all ${
                  results[0]?.slot === i ? 'ring-2 ring-white scale-105' : ''
                }`}
                style={{
                  backgroundColor: mult >= 3 ? (riskColor === 'red' ? '#dc2626' : riskColor === 'yellow' ? '#ca8a04' : '#16a34a') :
                                   mult >= 1 ? (riskColor === 'red' ? '#dc262660' : riskColor === 'yellow' ? '#ca8a0460' : '#16a34a60') :
                                   '#37415160'
                }}
              >
                <span className={mult >= 1 ? 'text-white' : 'text-gray-400'}>{mult}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Profit Display */}
        {results.length > 0 && (
          <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-bold ${
            totalProfit >= 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            Session: {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-72 bg-[#0a0a12] rounded-2xl p-3 flex flex-col gap-3">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <button onClick={() => handleBetChange(1)} className="btn-secondary py-1.5 text-xs font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} className="btn-secondary py-1.5 text-xs font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} className="btn-secondary py-1.5 text-xs font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} className="btn-secondary py-1.5 text-xs font-bold">MAX</button>
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-1">
            {Object.keys(RISK_LEVELS).map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  risk === r
                    ? r === 'low' ? 'bg-green-600 text-white' :
                      r === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Multipliers Preview */}
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-xs text-gray-500 mb-1">Multipliers</div>
          <div className="flex gap-1 flex-wrap">
            {[...new Set(currentMultipliers)].sort((a, b) => b - a).map((m, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  m >= 3 ? 'bg-green-600/30 text-green-400' :
                  m >= 1 ? 'bg-gray-600/30 text-gray-300' :
                  'bg-red-600/30 text-red-400'
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
          className={`py-3 rounded-xl font-bold transition-all ${
            bet <= 0 || bet > state.balance
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white'
          }`}
        >
          DROP BALL {balls.length > 0 && `(${balls.length} active)`}
        </button>

        {/* Info */}
        <div className="text-[10px] text-gray-500 text-center">
          Click multiple times to drop multiple balls!
        </div>

        {/* Results History */}
        {results.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Recent Drops</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {results.map((r) => (
                <div
                  key={r.id}
                  className={`flex justify-between px-2 py-1 rounded text-xs ${
                    r.won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  <span className="text-gray-500 text-[10px] uppercase">{r.risk}</span>
                  <span className="font-bold">{r.mult}x</span>
                  <span>{r.profit >= 0 ? '+' : ''}${r.profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
