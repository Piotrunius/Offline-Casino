import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function LimboGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [displayMult, setDisplayMult] = useState(null);
  const [history, setHistory] = useState([]);

  const winChance = (99 / target);

  const play = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'limbo')) return;

    setPlaying(true);
    setResult(null);
    audio.playBet();

    // Generate outcome (house edge ~1%)
    const rand = Math.random();
    const outcome = 0.99 / rand;
    const won = outcome >= target;

    // Animate
    const duration = state.settings.fastMode ? 500 : 1000;
    let frame = 0;
    const maxFrames = 20;
    const animate = () => {
      if (frame < maxFrames) {
        setDisplayMult(Math.random() * 10 + 1);
        frame++;
        setTimeout(animate, duration / maxFrames);
      } else {
        setPlaying(false);
        setDisplayMult(outcome);

        const mult = won ? target : 0;
        const winAmount = bet * mult;
        setResult({ outcome, won, mult, profit: won ? winAmount - bet : -bet });
        setHistory(h => [{ mult: outcome, won }, ...h.slice(0, 4)]);

        if (won) {
          addWin(winAmount, bet, 'limbo', target);
          audio.playWin();
        } else {
          addWin(0, bet, 'limbo', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [playing, bet, state.balance, target, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col items-center justify-center">
        {/* Multiplier Display */}
        <div className={`text-7xl font-black ${
          result ? (result.won ? 'text-green-400' : 'text-red-400') : 'text-white'
        }`}>
          {displayMult ? displayMult.toFixed(2) : '?.??'}x
        </div>

        {/* Target indicator */}
        <div className="mt-4 text-gray-500">
          Target: <span className="text-cyan-400 font-bold">{target.toFixed(2)}x</span>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN! +$${result.profit.toFixed(2)}` : `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Target Multiplier */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Target: {target.toFixed(2)}x</label>
            <input
              type="range"
              min={1.01}
              max={100}
              step={0.01}
              value={target}
              onChange={(e) => !playing && setTarget(Number(e.target.value))}
              disabled={playing}
              className="w-full mt-1 accent-cyan-500"
            />
            <div className="grid grid-cols-4 gap-1 mt-1">
              {[1.5, 2, 5, 10].map(v => (
                <button key={v} onClick={() => !playing && setTarget(v)} disabled={playing}
                  className={`py-1 rounded text-xs font-bold ${target === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {v}x
                </button>
              ))}
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
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Win Chance</span>
              <span className="text-cyan-400 font-bold">{winChance.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Profit on Win</span>
              <span className="text-green-400 font-bold">${(bet * target - bet).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={play}
            disabled={playing || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {playing ? 'ROLLING...' : 'PLAY'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult.toFixed(1)}x
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
