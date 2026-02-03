import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function DiceGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const winChance = rollOver ? (100 - target) : target;
  const multiplier = (99 / winChance).toFixed(4);

  const roll = useCallback(() => {
    if (rolling || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'dice')) return;

    setRolling(true);
    setResult(null);
    audio.playBet();

    const outcome = Math.random() * 100;
    const won = rollOver ? outcome > target : outcome < target;

    // Animate
    const duration = state.settings.fastMode ? 500 : 1000;
    let frame = 0;
    const maxFrames = 20;
    const animate = () => {
      if (frame < maxFrames) {
        setResult({ roll: Math.random() * 100, won: null });
        frame++;
        setTimeout(animate, duration / maxFrames);
      } else {
        setRolling(false);
        const mult = won ? parseFloat(multiplier) : 0;
        const winAmount = bet * mult;

        setResult({ roll: outcome, won, mult, win: winAmount });
        setHistory(h => [{ roll: outcome, won }, ...h.slice(0, 4)]);

        if (won) {
          addWin(winAmount, bet, 'dice', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'dice', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [rolling, bet, state.balance, target, rollOver, multiplier, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col items-center justify-center">
        {/* Dice Display */}
        <div className="text-6xl font-black text-white mb-4">
          {result ? result.roll.toFixed(2) : '?.??'}
        </div>

        {/* Slider visualization */}
        <div className="w-full max-w-md">
          <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`absolute h-full ${rollOver ? 'bg-green-600' : 'bg-red-600'}`}
              style={{
                left: rollOver ? `${target}%` : 0,
                right: rollOver ? 0 : `${100 - target}%`
              }}
            />
            {result && result.roll !== undefined && (
              <div
                className="absolute w-1 h-full bg-white"
                style={{ left: `${result.roll}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{target}</span>
            <span>100</span>
          </div>
        </div>

        {/* Result */}
        {result && result.won !== null && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN ${result.mult.toFixed(2)}x → +$${(result.win - bet).toFixed(2)}` : `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Roll Over/Under */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Prediction</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => !rolling && setRollOver(true)}
                disabled={rolling}
                className={`py-2 rounded-lg font-bold ${rollOver ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                OVER
              </button>
              <button
                onClick={() => !rolling && setRollOver(false)}
                disabled={rolling}
                className={`py-2 rounded-lg font-bold ${!rollOver ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                UNDER
              </button>
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Target: {target}</label>
            <input
              type="range"
              min={2}
              max={98}
              value={target}
              onChange={(e) => !rolling && setTarget(Number(e.target.value))}
              disabled={rolling}
              className="w-full mt-1 accent-cyan-500"
            />
          </div>

          {/* Stats */}
          <div className="bg-black/30 rounded-lg p-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Win Chance</span>
              <span className="text-cyan-400 font-bold">{winChance.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-green-400 font-bold">{multiplier}x</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Profit on Win</span>
              <span className="text-yellow-400 font-bold">${(bet * parseFloat(multiplier) - bet).toFixed(2)}</span>
            </div>
          </div>

          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={rolling}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={rolling} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={rolling} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={rolling} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={rolling} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={roll}
            disabled={rolling || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {rolling ? 'ROLLING...' : 'ROLL DICE'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.roll.toFixed(0)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
