import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

export default function DiceGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [displayValue, setDisplayValue] = useState(50.00);
  const [history, setHistory] = useState([]);

  const winChance = rollOver ? (100 - target) : target;
  const multiplier = parseFloat((99 / winChance).toFixed(4));
  const profit = (bet * multiplier - bet).toFixed(2);

  const roll = useCallback(() => {
    if (rolling || bet <= 0 || bet > state.balance) return;

    if (!placeBet(bet, 'dice')) return;
    setRolling(true);
    setResult(null);

    let frame = 0;
    const maxFrames = 30;

    const animate = () => {
      frame++;
      setDisplayValue((Math.random() * 100).toFixed(2));

      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        const finalValue = parseFloat((Math.random() * 100).toFixed(2));
        setDisplayValue(finalValue);

        const won = rollOver ? finalValue > target : finalValue < target;

        if (won) {
          const winAmount = bet * multiplier;
          addWin(winAmount, bet, 'dice', multiplier);
          setResult({ won: true, value: finalValue, profit: (winAmount - bet).toFixed(2) });
        } else {
          addWin(0, bet, 'dice', 0);
          setResult({ won: false, value: finalValue, profit: (-bet).toFixed(2) });
        }

        setHistory(h => [{ value: finalValue, won }, ...h.slice(0, 9)]);
        setRolling(false);
      }
    };

    requestAnimationFrame(animate);
  }, [bet, target, rollOver, rolling, state.balance, placeBet, addWin, multiplier]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Display */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="text-center mb-8">
          <div className={`text-8xl font-black mb-4 transition-all ${
            result === null ? 'text-white' : result.won ? 'text-green-400' : 'text-red-400'
          }`}>
            {displayValue}
          </div>

          {result && (
            <div className={`text-2xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.profit}` : `-$${bet.toFixed(2)}`}
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <div className="relative h-4 bg-[#12121f] rounded-full overflow-hidden">
            <div
              className={`absolute top-0 h-full transition-all ${rollOver ? 'bg-green-500/30' : 'bg-red-500/30'}`}
              style={{
                left: rollOver ? `${target}%` : '0%',
                right: rollOver ? '0%' : `${100 - target}%`
              }}
            />
            <div
              className="absolute top-0 w-1 h-full bg-cyan-400"
              style={{ left: `${target}%` }}
            />
          </div>

          <input
            type="range"
            min="2"
            max="98"
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value))}
            disabled={rolling}
            className="w-full"
          />

          <div className="flex justify-between text-sm text-gray-500">
            <span>0</span>
            <span className="text-cyan-400 font-bold">{target}</span>
            <span>100</span>
          </div>
        </div>

        {/* Roll Type */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => setRollOver(false)}
            disabled={rolling}
            className={`py-3 rounded-xl font-bold transition ${
              !rollOver
                ? 'bg-red-500 text-white'
                : 'bg-[#12121f] text-gray-400 hover:text-white'
            }`}
          >
            Roll Under {target}
          </button>
          <button
            onClick={() => setRollOver(true)}
            disabled={rolling}
            className={`py-3 rounded-xl font-bold transition ${
              rollOver
                ? 'bg-green-500 text-white'
                : 'bg-[#12121f] text-gray-400 hover:text-white'
            }`}
          >
            Roll Over {target}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#12121f] rounded-xl p-4 text-center">
            <div className="text-xs text-gray-500 uppercase mb-1">Multiplier</div>
            <div className="text-xl font-bold text-cyan-400">{multiplier}x</div>
          </div>
          <div className="bg-[#12121f] rounded-xl p-4 text-center">
            <div className="text-xs text-gray-500 uppercase mb-1">Win Chance</div>
            <div className="text-xl font-bold text-white">{winChance.toFixed(2)}%</div>
          </div>
          <div className="bg-[#12121f] rounded-xl p-4 text-center">
            <div className="text-xs text-gray-500 uppercase mb-1">Profit</div>
            <div className="text-xl font-bold text-green-400">+${profit}</div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Rolls</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.value}
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
          onPlay={roll}
          disabled={rolling}
          balance={state.balance}
          buttonText={rolling ? 'ROLLING...' : 'ROLL DICE'}
        />
      </div>
    </div>
  );
}
