import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.1, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.1, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

export default function PlinkoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [risk, setRisk] = useState('medium');
  const [rows, setRows] = useState(12);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [ballPath, setBallPath] = useState([]);
  const [ballPos, setBallPos] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const multipliers = MULTIPLIERS[rows][risk];
  const buckets = rows + 1;

  const drop = useCallback(() => {
    if (dropping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'plinko')) return;

    setDropping(true);
    setResult(null);
    setBallPath([]);
    audio.playBet();

    // Calculate path - ball goes left or right at each row
    const path = [];
    let position = 0;
    for (let i = 0; i < rows; i++) {
      const goRight = Math.random() > 0.5;
      position += goRight ? 1 : 0;
      path.push({ row: i, pos: position, dir: goRight ? 'R' : 'L' });
    }

    const finalBucket = position;
    const mult = multipliers[finalBucket];
    const winAmount = bet * mult;

    // Animate ball falling
    let step = 0;
    const animate = () => {
      if (step <= rows) {
        setBallPos({ row: step, pos: step === 0 ? rows / 2 : path[step - 1]?.pos + (rows - step) / 2 });
        setBallPath(path.slice(0, step));
        step++;
        animRef.current = setTimeout(animate, state.settings.fastMode ? 50 : 120);
      } else {
        setDropping(false);
        setBallPos(null);
        setResult({ bucket: finalBucket, mult, win: winAmount });
        setHistory(h => [{ mult, win: winAmount > bet }, ...h.slice(0, 4)]);

        if (winAmount > bet) {
          addWin(winAmount, bet, 'plinko', mult);
          audio.playWin();
        } else {
          addWin(winAmount, bet, 'plinko', mult);
          if (mult === 0) audio.playLose();
        }
      }
    };
    animate();

    return () => clearTimeout(animRef.current);
  }, [dropping, bet, state.balance, rows, risk, multipliers, placeBet, addWin, state.settings.fastMode]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  // Calculate peg positions
  const getPegX = (row, pegIndex) => {
    const totalPegs = row + 3;
    const spacing = 100 / (totalPegs + 1);
    return spacing * (pegIndex + 1);
  };

  const getPegY = (row) => 8 + (row * (72 / rows));

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {/* Pegs */}
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Draw pegs */}
            {Array.from({ length: rows }).map((_, row) => {
              const pegsInRow = row + 3;
              return Array.from({ length: pegsInRow }).map((_, peg) => {
                const x = getPegX(row, peg);
                const y = getPegY(row);
                const isHit = ballPath.some(p => p.row === row);
                return (
                  <circle
                    key={`${row}-${peg}`}
                    cx={x}
                    cy={y}
                    r={0.8}
                    fill={isHit ? '#00f5ff' : '#444'}
                    className={isHit ? 'animate-pulse' : ''}
                  />
                );
              });
            })}

            {/* Ball */}
            {ballPos && (
              <circle
                cx={getPegX(ballPos.row, ballPos.pos) || 50}
                cy={getPegY(ballPos.row)}
                r={1.5}
                fill="#ff6600"
                className="drop-shadow-lg"
              />
            )}

            {/* Buckets */}
            {multipliers.map((mult, i) => {
              const w = 100 / buckets;
              const x = i * w;
              let color = '#333';
              if (mult >= 100) color = '#ff0066';
              else if (mult >= 10) color = '#ff3366';
              else if (mult >= 3) color = '#ff8800';
              else if (mult >= 1) color = '#00cc66';
              else color = '#444';

              return (
                <g key={i}>
                  <rect x={x + 1} y={85} width={w - 2} height={12} rx={1} fill={color} opacity={0.8} />
                  <text x={x + w / 2} y={92} textAnchor="middle" fill="#fff" fontSize={rows > 12 ? 2 : 2.5} fontWeight="bold">
                    {mult}x
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-2 rounded-lg mt-2 ${result.win ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-lg font-black ${result.mult >= 1 ? 'text-green-400' : 'text-red-400'}`}>
              {result.mult}x → ${(result.mult * bet).toFixed(2)}
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
                disabled={dropping}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={dropping} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={dropping} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={dropping} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={dropping} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Risk */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Risk Level</label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {['low', 'medium', 'high'].map(r => (
                <button
                  key={r}
                  onClick={() => !dropping && setRisk(r)}
                  disabled={dropping}
                  className={`py-2 rounded-lg text-xs font-bold capitalize ${risk === r ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Rows: {rows}</label>
            <input
              type="range"
              min={8}
              max={16}
              step={4}
              value={rows}
              onChange={(e) => !dropping && setRows(Number(e.target.value))}
              disabled={dropping}
              className="w-full mt-1 accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>8</span><span>12</span><span>16</span>
            </div>
          </div>

          {/* Drop Button */}
          <button
            onClick={drop}
            disabled={dropping || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dropping ? 'DROPPING...' : 'DROP BALL'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">History</div>
              <div className="flex gap-1 flex-wrap">
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
