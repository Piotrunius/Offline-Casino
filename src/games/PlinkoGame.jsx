import { useCallback, useState, useRef } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const RISK_LEVELS = {
  low: { multipliers: [1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4], color: 'green' },
  medium: { multipliers: [3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3], color: 'yellow' },
  high: { multipliers: [10, 3, 1.5, 0.5, 0, 0.5, 1.5, 3, 10], color: 'red' }
};

const PEG_ROWS = 10;

export default function PlinkoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [risk, setRisk] = useState('medium');
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 0 });
  const [ballPath, setBallPath] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode;

  const drop = useCallback(async () => {
    if (dropping || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'plinko');
    if (!confirmed) return;

    setDropping(true);
    setResult(null);
    setBallPath([]);
    audio.playBet();

    const duration = state.settings.fastMode ? 1500 : 3000;
    const startTime = Date.now();

    // Generate path through pegs
    const multipliers = RISK_LEVELS[risk].multipliers;
    const path = [{ x: 50, y: 0 }];
    let currentX = 50;

    // If god mode, bias towards high multipliers
    let targetSlot;
    if (godMode) {
      const maxMult = Math.max(...multipliers);
      const highIndices = multipliers.map((m, i) => m === maxMult ? i : -1).filter(i => i !== -1);
      targetSlot = highIndices[Math.floor(Math.random() * highIndices.length)];
    } else {
      targetSlot = Math.floor(Math.random() * multipliers.length);
    }

    // Calculate path to reach target slot
    const targetX = (targetSlot / (multipliers.length - 1)) * 100;
    const xStep = (targetX - 50) / PEG_ROWS;

    for (let row = 1; row <= PEG_ROWS; row++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const randomOffset = direction * (2 + Math.random() * 3);
      
      // Bias towards target
      if (godMode) {
        currentX += xStep + (Math.random() - 0.5) * 2;
      } else {
        currentX += randomOffset;
      }
      
      currentX = Math.max(5, Math.min(95, currentX));
      path.push({ x: currentX, y: (row / PEG_ROWS) * 100 });
    }

    // Determine final slot
    const finalSlot = godMode ? targetSlot : Math.round((currentX / 100) * (multipliers.length - 1));
    const clampedSlot = Math.max(0, Math.min(multipliers.length - 1, finalSlot));
    const mult = multipliers[clampedSlot];

    let pathIndex = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Move through path
      const currentPathIndex = Math.min(Math.floor(progress * path.length), path.length - 1);
      if (currentPathIndex !== pathIndex) {
        pathIndex = currentPathIndex;
        setBallPath(path.slice(0, pathIndex + 1));
        audio.playClick();
      }
      setBallPos(path[currentPathIndex]);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDropping(false);

        setHistory(h => [{ mult, slot: clampedSlot, risk }, ...h.slice(0, 3)]);

        if (mult > 0) {
          const winAmount = bet * mult;
          addWin(winAmount, bet, 'plinko', mult);
          setResult({ won: mult >= 1, mult, profit: winAmount - bet, slot: clampedSlot });
          if (mult >= 1) audio.playWin();
          else audio.playLose();
        } else {
          addWin(0, bet, 'plinko', 0);
          setResult({ won: false, mult: 0, profit: -bet, slot: clampedSlot });
          audio.playLose();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [dropping, bet, state.balance, risk, godMode, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const currentMultipliers = RISK_LEVELS[risk].multipliers;
  const riskColor = RISK_LEVELS[risk].color;

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center relative">
        {/* Plinko Board */}
        <div className="relative w-full max-w-md aspect-[3/4] bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
          {/* Pegs */}
          {[...Array(PEG_ROWS)].map((_, row) => (
            <div 
              key={row} 
              className="absolute w-full flex justify-center gap-6"
              style={{ top: `${((row + 1) / (PEG_ROWS + 1)) * 85}%` }}
            >
              {[...Array(row + 3)].map((_, col) => (
                <div
                  key={col}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-lg"
                />
              ))}
            </div>
          ))}

          {/* Ball Trail */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {ballPath.length > 1 && (
              <path
                d={`M ${ballPath.map(p => `${p.x}% ${p.y * 0.85}%`).join(' L ')}`}
                stroke="rgba(0, 245, 255, 0.3)"
                strokeWidth="2"
                fill="none"
              />
            )}
          </svg>

          {/* Ball */}
          {dropping && (
            <div
              className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg transition-all duration-75"
              style={{
                left: `calc(${ballPos.x}% - 10px)`,
                top: `calc(${ballPos.y * 0.85}% - 10px)`,
                boxShadow: '0 0 20px rgba(0, 245, 255, 0.6)'
              }}
            />
          )}

          {/* Multiplier Slots */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-2">
            {currentMultipliers.map((mult, i) => (
              <div
                key={i}
                className={`flex-1 mx-0.5 py-2 rounded-lg text-center text-xs font-bold transition-all ${
                  result?.slot === i ? 'scale-110 ring-2 ring-white' : ''
                } ${
                  mult >= 3 ? `bg-${riskColor}-600` :
                  mult >= 1 ? `bg-${riskColor}-700/50` :
                  'bg-gray-700/50'
                }`}
                style={{
                  backgroundColor: mult >= 3 ? (riskColor === 'red' ? '#dc2626' : riskColor === 'yellow' ? '#ca8a04' : '#16a34a') :
                                   mult >= 1 ? (riskColor === 'red' ? '#dc262660' : riskColor === 'yellow' ? '#ca8a0460' : '#16a34a60') :
                                   '#37415160'
                }}
              >
                <span className={mult >= 1 ? 'text-white' : 'text-gray-400'}>
                  {mult}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 px-6 py-3 rounded-xl ${
            result.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            <div className="text-center">
              <span className="text-2xl font-bold">
                {result.mult}x → {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={dropping}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button onClick={() => handleBetChange(1)} disabled={dropping} className="btn-secondary py-2 text-sm font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={dropping} className="btn-secondary py-2 text-sm font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={dropping} className="btn-secondary py-2 text-sm font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={dropping} className="btn-secondary py-2 text-sm font-bold">MAX</button>
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(RISK_LEVELS).map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                disabled={dropping}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
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
        <div className="bg-black/30 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-2">Possible Multipliers</div>
          <div className="flex gap-1 flex-wrap">
            {[...new Set(currentMultipliers)].sort((a, b) => b - a).map((m, i) => (
              <span 
                key={i} 
                className={`px-2 py-1 rounded text-xs font-bold ${
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
          onClick={drop}
          disabled={dropping || bet <= 0 || bet > state.balance}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            dropping
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white'
          }`}
        >
          {dropping ? 'DROPPING...' : 'DROP BALL'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">History</div>
            <div className="space-y-1">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex justify-between px-3 py-2 rounded-lg text-sm ${
                    h.mult >= 1 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  <span className="text-gray-500 text-xs uppercase">{h.risk}</span>
                  <span className="font-bold">{h.mult}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
