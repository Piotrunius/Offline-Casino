import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

export default function LimboGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [displayMult, setDisplayMult] = useState(1.00);
  const [history, setHistory] = useState([]);

  const winChance = (99 / targetMultiplier).toFixed(2);

  const play = useCallback(() => {
    if (bet <= 0 || bet > state.balance || playing) return;
    if (!placeBet(bet, 'limbo')) return;

    setPlaying(true);
    setResult(null);

    // Generate result
    const crashPoint = Math.max(1, (0.99 / Math.random()));
    const won = crashPoint >= targetMultiplier;

    // Animate
    let frame = 0;
    const maxFrames = 25;
    const animate = () => {
      frame++;
      if (frame < maxFrames) {
        setDisplayMult(parseFloat((1 + Math.random() * (crashPoint - 1) * (frame / maxFrames)).toFixed(2)));
        requestAnimationFrame(animate);
      } else {
        setDisplayMult(parseFloat(crashPoint.toFixed(2)));

        if (won) {
          const winAmount = bet * targetMultiplier;
          addWin(winAmount, bet, 'limbo', targetMultiplier);
          setResult({ won: true, mult: crashPoint, profit: (winAmount - bet).toFixed(2) });
        } else {
          addWin(0, bet, 'limbo', 0);
          setResult({ won: false, mult: crashPoint, profit: (-bet).toFixed(2) });
        }

        setHistory(h => [{ mult: parseFloat(crashPoint.toFixed(2)), won, target: targetMultiplier }, ...h.slice(0, 9)]);
        setPlaying(false);
      }
    };

    requestAnimationFrame(animate);
  }, [bet, targetMultiplier, state.balance, playing, placeBet, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Display */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase mb-2">Result</div>
          <div className={`text-9xl font-black mb-4 transition-all ${
            result === null ? 'text-white' : result.won ? 'text-green-400' : 'text-red-400'
          }`}>
            {displayMult.toFixed(2)}x
          </div>

          {result && (
            <div className={`text-2xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.profit}` : `-$${bet.toFixed(2)}`}
            </div>
          )}
        </div>

        {/* Target Display */}
        <div className="mt-8 bg-[#12121f] rounded-xl p-6 text-center">
          <div className="text-xs text-gray-500 uppercase mb-2">Target Multiplier</div>
          <div className="text-4xl font-black text-cyan-400">{targetMultiplier.toFixed(2)}x</div>
          <div className="text-sm text-gray-400 mt-2">
            Win Chance: <span className="text-white font-bold">{winChance}%</span>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Games</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.mult}x
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
          onPlay={play}
          disabled={playing}
          balance={state.balance}
          buttonText={playing ? 'PLAYING...' : 'PLAY'}
        >
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
              Target Multiplier
            </label>
            <input
              type="number"
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              disabled={playing}
              className="w-full bg-[#12121f] border border-[#2a2a45] rounded-lg px-4 py-3 text-white font-bold text-lg disabled:opacity-50"
              step="0.1"
              min="1.01"
            />
            <input
              type="range"
              min="1.01"
              max="100"
              step="0.1"
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(parseFloat(e.target.value))}
              disabled={playing}
              className="w-full mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-[#12121f] rounded-lg p-3">
              <div className="text-xs text-gray-500">Win Chance</div>
              <div className="text-lg font-bold text-white">{winChance}%</div>
            </div>
            <div className="bg-[#12121f] rounded-lg p-3">
              <div className="text-xs text-gray-500">Profit</div>
              <div className="text-lg font-bold text-green-400">
                +${(bet * targetMultiplier - bet).toFixed(2)}
              </div>
            </div>
          </div>
        </BetControls>
      </div>
    </div>
  );
}
