import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const PAYOUT_TABLE = {
  0: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  1: [0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  2: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  3: [0, 0, 0, 0, 0, 1, 1.5, 1.5, 2, 2, 2],
  4: [0, 0, 0, 0, 0, 2, 3, 5, 7, 10, 15],
  5: [0, 0, 0, 0, 0, 0, 5, 10, 15, 25, 50],
  6: [0, 0, 0, 0, 0, 0, 0, 15, 40, 100, 200],
  7: [0, 0, 0, 0, 0, 0, 0, 0, 100, 250, 500],
  8: [0, 0, 0, 0, 0, 0, 0, 0, 0, 500, 1000],
  9: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2500],
  10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10000]
};

export default function KenoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [selected, setSelected] = useState(new Set());
  const [drawn, setDrawn] = useState(new Set());
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [randomCount, setRandomCount] = useState(5);

  const toggleNumber = (n) => {
    if (playing) return;
    const newSet = new Set(selected);
    if (newSet.has(n)) {
      newSet.delete(n);
    } else if (newSet.size < 10) {
      newSet.add(n);
    }
    setSelected(newSet);
  };

  const selectRandom = () => {
    if (playing) return;
    const nums = new Set();
    while (nums.size < randomCount) {
      nums.add(Math.floor(Math.random() * 40) + 1);
    }
    setSelected(nums);
  };

  const clearSelection = () => {
    if (playing) return;
    setSelected(new Set());
  };

  const play = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance || selected.size === 0) return;
    if (!placeBet(bet, 'keno')) return;

    setPlaying(true);
    setDrawn(new Set());
    setResult(null);
    audio.playBet();

    // Draw 10 numbers
    const drawnNums = new Set();
    while (drawnNums.size < 10) {
      drawnNums.add(Math.floor(Math.random() * 40) + 1);
    }

    // Animate drawing
    const drawnArr = Array.from(drawnNums);
    let idx = 0;
    const drawNext = () => {
      if (idx < drawnArr.length) {
        setDrawn(new Set(drawnArr.slice(0, idx + 1)));
        idx++;
        setTimeout(drawNext, state.settings.fastMode ? 100 : 200);
      } else {
        // Calculate result
        const hits = Array.from(selected).filter(n => drawnNums.has(n)).length;
        const picks = selected.size;
        const mult = PAYOUT_TABLE[picks]?.[hits] || 0;
        const winAmount = bet * mult;

        setPlaying(false);
        setResult({ hits, picks, mult, profit: winAmount - bet });
        setHistory(h => [{ hits, won: mult > 0 }, ...h.slice(0, 4)]);

        if (mult > 0) {
          addWin(winAmount, bet, 'keno', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'keno', 0);
          audio.playLose();
        }
      }
    };
    drawNext();
  }, [playing, bet, state.balance, selected, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-2 flex flex-col">
        {/* Grid */}
        <div className="grid grid-cols-8 gap-1 flex-1">
          {Array.from({ length: 40 }, (_, i) => i + 1).map(n => {
            const isSelected = selected.has(n);
            const isDrawn = drawn.has(n);
            const isHit = isSelected && isDrawn;

            return (
              <button
                key={n}
                onClick={() => toggleNumber(n)}
                disabled={playing}
                className={`aspect-square rounded text-xs font-bold transition-all flex items-center justify-center ${
                  isHit
                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                    : isDrawn
                      ? 'bg-yellow-600 text-white'
                      : isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-2 text-center py-2 rounded-lg ${result.mult > 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-lg font-black ${result.mult > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.hits}/{result.picks} hits → {result.mult > 0 ? `${result.mult}x +$${result.profit.toFixed(2)}` : 'No win'}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-56 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-2 flex-1 flex flex-col gap-2">
          {/* Selection info */}
          <div className="text-center text-sm">
            <span className="text-gray-500">Selected: </span>
            <span className="text-cyan-400 font-bold">{selected.size}/10</span>
          </div>

          {/* Random Pick Slider */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Quick Pick: {randomCount}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              disabled={playing}
              className="w-full mt-1 accent-cyan-500"
            />
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button onClick={selectRandom} disabled={playing} className="btn-secondary py-1 text-xs">RANDOM</button>
              <button onClick={clearSelection} disabled={playing} className="btn-secondary py-1 text-xs">CLEAR</button>
            </div>
          </div>

          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet</label>
            <div className="relative mt-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-1.5 pl-6 pr-2 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-0.5 text-[10px]">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-0.5 text-[10px]">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-0.5 text-[10px]">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-0.5 text-[10px]">MAX</button>
            </div>
          </div>

          {/* Paytable preview */}
          {selected.size > 0 && (
            <div className="bg-black/30 rounded p-1.5 text-[10px] max-h-20 overflow-y-auto">
              <div className="text-gray-500 uppercase mb-1">Payouts ({selected.size} picks)</div>
              {PAYOUT_TABLE[selected.size]?.map((mult, hits) => mult > 0 && (
                <div key={hits} className="flex justify-between">
                  <span>{hits} hits</span>
                  <span className="text-green-400">{mult}x</span>
                </div>
              ))}
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={play}
            disabled={playing || bet <= 0 || bet > state.balance || selected.size === 0}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black disabled:opacity-50 mt-auto"
          >
            {playing ? 'DRAWING...' : 'PLAY'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1">
              {history.map((h, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.hits}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
