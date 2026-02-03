import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function LimboGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [displayMult, setDisplayMult] = useState(1);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const winChance = (1 / target) * 100;

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const play = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'limbo')) return;

    setPlaying(true);
    setResult(null);
    audio.playBet();

    // Generate result - house edge ~2%
    const random = Math.random();
    const finalMult = random < 0.02 ? 1 : Math.max(1, 0.99 / random);
    const roundedMult = parseFloat(finalMult.toFixed(2));
    const won = roundedMult >= target;

    const duration = state.settings.fastMode ? 600 : 1800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentDisplay = 1 + (roundedMult - 1) * easeOut;
        setDisplayMult(parseFloat(currentDisplay.toFixed(2)));
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayMult(roundedMult);

        if (won) {
          const winAmount = bet * target;
          addWin(winAmount, bet, 'limbo', target);
          audio.playWin();
          setResult({ won: true, mult: roundedMult, profit: winAmount - bet });
        } else {
          addWin(0, bet, 'limbo', 0);
          audio.playLose();
          setResult({ won: false, mult: roundedMult, profit: -bet });
        }

        setHistory(h => [{ won, mult: roundedMult, target }, ...h.slice(0, 19)]);
        setPlaying(false);
      }
    };

    animate();
  }, [bet, state.balance, state.settings.fastMode, target, placeBet, addWin, playing]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Result Display */}
        <div className="text-center mb-8">
          <div className={`text-9xl font-black tabular-nums ${
            result
              ? result.won
                ? 'text-green-400'
                : 'text-red-400'
              : displayMult >= target
                ? 'text-green-400'
                : 'text-white'
          }`}>
            {displayMult.toFixed(2)}x
          </div>
          {result && (
            <div className={`text-2xl font-bold mt-4 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN +$${result.profit.toFixed(2)}` : `LOST`}
            </div>
          )}
        </div>

        {/* Target Multiplier */}
        <div className="mb-6">
          <div className="text-gray-400 text-sm mb-2">Target Multiplier</div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1.01"
              max="100"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              disabled={playing}
              className="flex-1 accent-cyan-500"
            />
            <input
              type="number"
              min="1.01"
              max="1000"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              disabled={playing}
              className="w-24 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-right font-mono"
            />
          </div>
        </div>

        {/* Quick targets */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[1.5, 2, 3, 5, 10, 50].map(t => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              disabled={playing}
              className={`py-3 rounded-lg font-bold transition-all ${
                target === t
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t}x
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Target</div>
            <div className="text-2xl font-bold text-cyan-400">{target.toFixed(2)}x</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Win Chance</div>
            <div className="text-2xl font-bold text-yellow-400">{winChance.toFixed(2)}%</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Profit on Win</div>
            <div className="text-2xl font-bold text-green-400">${(bet * (target - 1)).toFixed(2)}</div>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={play}
          disabled={playing || bet <= 0 || bet > state.balance}
          className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
            playing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400'
          } text-white`}
        >
          {playing ? 'PLAYING...' : 'PLAY'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={play} buttonText="PLAY" hideButton />

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={h.won ? 'text-green-400' : 'text-red-400'}>
                    {h.mult.toFixed(2)}x
                  </span>
                  <span className="text-gray-500">target {h.target}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
