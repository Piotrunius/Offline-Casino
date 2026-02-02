import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

export default function CrashGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [gameState, setGameState] = useState('waiting'); // waiting, running, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
  const [history, setHistory] = useState([]);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // Generate crash point
  const generateCrashPoint = () => {
    const r = Math.random();
    return Math.max(1, Math.floor(100 / (r * 100)) / 100);
  };

  const crashPointRef = useRef(1);

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance || gameState === 'running') return;
    if (!placeBet(bet, 'crash')) return;

    crashPointRef.current = generateCrashPoint();
    setGameState('running');
    setMultiplier(1.00);
    setCashedOut(false);
    setCashoutMultiplier(null);
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMult = Math.pow(Math.E, elapsed * 0.1) * (1 + elapsed * 0.05);
      const newMult = parseFloat(Math.max(1, currentMult).toFixed(2));

      setMultiplier(newMult);

      if (newMult >= crashPointRef.current) {
        // Crashed!
        setGameState('crashed');
        setMultiplier(crashPointRef.current);
        if (!cashedOut) {
          addWin(0, bet, 'crash', 0);
        }
        setHistory(h => [{ mult: crashPointRef.current, won: cashedOut }, ...h.slice(0, 9)]);
        return;
      }

      // Auto cashout
      if (newMult >= autoCashout && !cashedOut) {
        doCashout(newMult);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [bet, state.balance, gameState, placeBet, autoCashout]);

  const doCashout = useCallback((mult) => {
    if (gameState !== 'running' || cashedOut) return;

    const winAmount = bet * mult;
    addWin(winAmount, bet, 'crash', mult);
    setCashedOut(true);
    setCashoutMultiplier(mult);
  }, [gameState, cashedOut, bet, addWin]);

  const cashout = () => doCashout(multiplier);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset game after crash
  useEffect(() => {
    if (gameState === 'crashed') {
      const timer = setTimeout(() => {
        setGameState('waiting');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Display */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="aspect-video bg-[#12121f] rounded-xl flex items-center justify-center relative overflow-hidden">
          {/* Graph Background */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="absolute w-full border-t border-gray-700" style={{ top: `${i * 10}%` }} />
            ))}
          </div>

          {/* Multiplier Display */}
          <div className="text-center z-10">
            <div className={`text-8xl font-black transition-all ${
              gameState === 'crashed' && !cashedOut
                ? 'text-red-500'
                : cashedOut
                  ? 'text-green-400'
                  : 'text-white'
            }`}>
              {multiplier.toFixed(2)}x
            </div>

            {gameState === 'crashed' && !cashedOut && (
              <div className="text-2xl font-bold text-red-400 mt-4">CRASHED!</div>
            )}

            {cashedOut && (
              <div className="text-2xl font-bold text-green-400 mt-4">
                +${(bet * cashoutMultiplier - bet).toFixed(2)}
              </div>
            )}

            {gameState === 'waiting' && (
              <div className="text-gray-500 mt-4">Place your bet and start!</div>
            )}
          </div>
        </div>

        {/* Cashout Button (during game) */}
        {gameState === 'running' && !cashedOut && (
          <button
            onClick={cashout}
            className="w-full mt-4 py-4 bg-orange-500 text-white rounded-xl font-black text-xl hover:brightness-110 transition"
          >
            CASHOUT ${(bet * multiplier).toFixed(2)}
          </button>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Crashes</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.mult >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.mult.toFixed(2)}x
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
          onPlay={startGame}
          disabled={gameState === 'running'}
          balance={state.balance}
          buttonText={gameState === 'running' ? 'RUNNING...' : 'START'}
        >
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
              Auto Cashout at {autoCashout}x
            </label>
            <input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              disabled={gameState === 'running'}
              className="w-full bg-[#12121f] border border-[#2a2a45] rounded-lg px-4 py-2 text-white font-bold disabled:opacity-50"
              step="0.1"
              min="1.01"
            />
          </div>
        </BetControls>
      </div>
    </div>
  );
}
