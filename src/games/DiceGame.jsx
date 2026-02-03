import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const ROLL_MIN = 0;
const ROLL_MAX = 100;

export default function DiceGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [displayRoll, setDisplayRoll] = useState(50);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const winChance = isOver ? ROLL_MAX - target : target;
  const multiplier = winChance > 0 ? (98 / winChance).toFixed(4) : 0;

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const roll = useCallback(() => {
    if (rolling || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'dice')) return;

    setRolling(true);
    setResult(null);
    audio.playBet();

    const finalRoll = Math.random() * 100;
    const rollRounded = parseFloat(finalRoll.toFixed(2));

    const duration = state.settings.fastMode ? 500 : 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        setDisplayRoll(parseFloat((Math.random() * 100).toFixed(2)));
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayRoll(rollRounded);

        const won = isOver ? rollRounded > target : rollRounded < target;

        if (won) {
          const mult = parseFloat(multiplier);
          const winAmount = bet * mult;
          addWin(winAmount, bet, 'dice', mult);
          audio.playWin();
          setResult({ won: true, roll: rollRounded, multiplier: mult, profit: winAmount - bet });
        } else {
          addWin(0, bet, 'dice', 0);
          audio.playLose();
          setResult({ won: false, roll: rollRounded, profit: -bet });
        }

        setHistory(h => [{ won, roll: rollRounded, target, isOver }, ...h.slice(0, 19)]);
        setRolling(false);
      }
    };

    animate();
  }, [bet, state.balance, state.settings.fastMode, target, isOver, multiplier, placeBet, addWin, rolling]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Roll Display */}
        <div className="text-center mb-8">
          <div className={`text-8xl font-black tabular-nums ${
            result
              ? result.won
                ? 'text-green-400'
                : 'text-red-400'
              : 'text-white'
          }`}>
            {displayRoll.toFixed(2)}
          </div>
          {result && (
            <div className={`text-2xl font-bold mt-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN +$${result.profit.toFixed(2)}` : `LOST -$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="relative mb-8">
          <div className="h-4 rounded-full bg-gray-700 overflow-hidden">
            <div
              className={`h-full ${isOver ? 'bg-green-600' : 'bg-red-600'} transition-all`}
              style={{ width: `${isOver ? 100 - target : target}%`, marginLeft: isOver ? `${target}%` : 0 }}
            />
          </div>
          <input
            type="range"
            min="2"
            max="98"
            step="1"
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value))}
            disabled={rolling}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-8 bg-white rounded shadow-lg pointer-events-none"
            style={{ left: `calc(${target}% - 12px)` }}
          />
        </div>

        {/* Over/Under Toggle */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setIsOver(false)}
            disabled={rolling}
            className={`py-4 rounded-xl font-bold text-lg transition-all ${
              !isOver
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            UNDER {target}
          </button>
          <button
            onClick={() => setIsOver(true)}
            disabled={rolling}
            className={`py-4 rounded-xl font-bold text-lg transition-all ${
              isOver
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            OVER {target}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Multiplier</div>
            <div className="text-2xl font-bold text-green-400">{multiplier}x</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Win Chance</div>
            <div className="text-2xl font-bold text-cyan-400">{winChance.toFixed(2)}%</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Profit on Win</div>
            <div className="text-2xl font-bold text-yellow-400">${(bet * multiplier - bet).toFixed(2)}</div>
          </div>
        </div>

        {/* Roll button */}
        <button
          onClick={roll}
          disabled={rolling || bet <= 0 || bet > state.balance}
          className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
            rolling
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400'
          } text-white`}
        >
          {rolling ? 'ROLLING...' : `ROLL ${isOver ? '>' : '<'} ${target}`}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={roll} buttonText="ROLL" hideButton />

        {/* Quick targets */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Quick Target</div>
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 75, 90].map(t => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                disabled={rolling}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  target === t ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{h.roll.toFixed(2)}</span>
                  <span>{h.isOver ? '>' : '<'} {h.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
