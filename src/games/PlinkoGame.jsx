import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const ROWS = 12;
const COLS = 9;

export default function PlinkoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [dropping, setDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState(null);
  const [finalPosition, setFinalPosition] = useState(null);

  const MULTIPLIERS = [100, 4, 1.5, 0.5, 0.2, 0, 0.2, 0.5, 1.5, 4, 100];

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const dropBall = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'plinko')) return;

    audio.playBet();
    setDropping(true);
    setGamePhase('dropping');
    setBallPosition(null);
    setFinalPosition(null);

    const steps = [];
    let col = Math.floor(COLS / 2);

    for (let row = 0; row < ROWS; row++) {
      col += Math.random() < 0.5 ? -1 : 1;
      col = Math.max(0, Math.min(col, COLS - 1));
      steps.push({ row, col });
    }

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setBallPosition(steps[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(interval);
        const finalCol = col;
        setFinalPosition(finalCol);

        const mult = MULTIPLIERS[finalCol];
        const won = mult > 0;
        const payout = bet * mult;

        if (won) {
          audio.playWin();
          addWin(payout, 'plinko');
        } else {
          audio.playLose();
        }

        setResult({ finalCol, mult, payout, won });
        setHistory(h => [{ finalCol, mult, won }, ...h.slice(0, 4)]);
        setGamePhase('result');
        setDropping(false);
      }
    }, 150);
  }, [bet, state.balance, placeBet, addWin]);

  const newGame = () => {
    setResult(null);
    setBallPosition(null);
    setFinalPosition(null);
    setGamePhase('betting');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-5 flex flex-col items-center justify-center">
        {/* Plinko Board */}
        <div className="relative bg-gray-900 rounded-xl p-4 border-2 border-gray-700">
          {/* Pegs */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: ROWS }).map((_, row) => (
              <div key={row} className="flex justify-center gap-2" style={{ marginLeft: `${(row % 2) * 15}px` }}>
                {Array.from({ length: COLS - (row % 2 ? 0 : 0) }).map((_, col) => (
                  <div
                    key={col}
                    className={`w-3 h-3 rounded-full ${
                      ballPosition?.row === row && ballPosition?.col === col
                        ? 'bg-yellow-300 shadow-lg shadow-yellow-300'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Buckets */}
          <div className="flex gap-1 mt-6 justify-center">
            {MULTIPLIERS.map((mult, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  finalPosition === idx
                    ? 'bg-yellow-500 scale-110 shadow-lg'
                    : mult === 0
                    ? 'bg-red-900/50 text-red-400'
                    : mult > 1
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {mult === 0 ? '0' : mult.toFixed(1)}x
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-6 p-4 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold mb-2">
              <span className={result.won ? 'text-green-400' : 'text-red-400'}>
                {result.mult}x
              </span>
            </div>
            <div className={`text-xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.payout.toFixed(0)}` : 'LOST'}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}
              >
                {h.mult.toFixed(1)}x
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
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
        </div>

        {/* Quick Bet */}
        <div className="grid grid-cols-3 gap-2">
          {[10, 25, 50, 100, 250, 500].map(v => (
            <button
              key={v}
              onClick={() => handleBetChange(v)}
              disabled={dropping}
              className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-50`}
            >
              ${v}
            </button>
          ))}
        </div>

        {/* Multipliers Guide */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-cyan-400 mb-2">Multipliers</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Best Case:</span>
              <span className="text-green-400 font-bold">100x</span>
            </div>
            <div className="flex justify-between">
              <span>Center (2 slots):</span>
              <span className="text-red-400">0x</span>
            </div>
            <div className="flex justify-between">
              <span>Mid Range:</span>
              <span>0.5x - 4x</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {gamePhase === 'betting' ? (
          <button
            onClick={dropBall}
            disabled={dropping}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 mt-auto"
          >
            {dropping ? 'DROPPING...' : 'DROP BALL'}
          </button>
        ) : (
          <button
            onClick={newGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg mt-auto"
          >
            NEW GAME
          </button>
        )}
      </div>
    </div>
  );
}
