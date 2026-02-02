import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const GRID_SIZE = 40;
const MAX_PICKS = 10;

const PAYOUTS = {
  1: { 1: 3.8 },
  2: { 1: 1.9, 2: 8.1 },
  3: { 1: 1.1, 2: 3.3, 3: 25.3 },
  4: { 2: 2.2, 3: 9.8, 4: 72 },
  5: { 2: 1.5, 3: 4.2, 4: 18.5, 5: 202 },
  6: { 3: 2.5, 4: 7.2, 5: 35, 6: 500 },
  7: { 3: 1.8, 4: 4.1, 5: 14, 6: 80, 7: 1000 },
  8: { 4: 2.5, 5: 6.5, 6: 25, 7: 150, 8: 2000 },
  9: { 4: 1.8, 5: 4, 6: 12, 7: 50, 8: 300, 9: 4000 },
  10: { 5: 2.5, 6: 6.5, 7: 20, 8: 80, 9: 500, 10: 10000 }
};

export default function KenoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const toggleNumber = (num) => {
    if (playing) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < MAX_PICKS) {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const clearSelection = () => {
    if (!playing) {
      setSelectedNumbers([]);
      setDrawnNumbers([]);
      setResult(null);
    }
  };

  const quickPick = () => {
    if (playing) return;
    const picks = [];
    while (picks.length < MAX_PICKS) {
      const num = Math.floor(Math.random() * GRID_SIZE) + 1;
      if (!picks.includes(num)) picks.push(num);
    }
    setSelectedNumbers(picks);
  };

  const play = useCallback(() => {
    if (selectedNumbers.length === 0 || bet <= 0 || bet > state.balance || playing) return;
    if (!placeBet(bet, 'keno')) return;

    setPlaying(true);
    setResult(null);
    setDrawnNumbers([]);

    // Draw 10 random numbers
    const drawn = [];
    while (drawn.length < 10) {
      const num = Math.floor(Math.random() * GRID_SIZE) + 1;
      if (!drawn.includes(num)) drawn.push(num);
    }

    // Animate drawing
    let i = 0;
    const drawNext = () => {
      if (i < drawn.length) {
        setDrawnNumbers(d => [...d, drawn[i]]);
        i++;
        setTimeout(drawNext, 200);
      } else {
        // Calculate result
        const hits = selectedNumbers.filter(n => drawn.includes(n)).length;
        const picks = selectedNumbers.length;
        const payout = PAYOUTS[picks]?.[hits] || 0;
        const winAmount = bet * payout;

        if (winAmount > 0) {
          addWin(winAmount, bet, 'keno', payout);
          setResult({ won: true, hits, payout, profit: (winAmount - bet).toFixed(2) });
        } else {
          addWin(0, bet, 'keno', 0);
          setResult({ won: false, hits, payout: 0, profit: (-bet).toFixed(2) });
        }

        setHistory(h => [{ hits, picks, won: winAmount > 0 }, ...h.slice(0, 9)]);
        setPlaying(false);
      }
    };

    setTimeout(drawNext, 300);
  }, [selectedNumbers, bet, state.balance, playing, placeBet, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Keno Grid */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6">
        <div className="grid grid-cols-8 gap-2 max-w-lg mx-auto">
          {[...Array(GRID_SIZE)].map((_, i) => {
            const num = i + 1;
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={playing}
                className={`aspect-square rounded-lg font-bold text-sm transition ${
                  isHit
                    ? 'bg-green-500 text-white'
                    : isDrawn
                      ? 'bg-red-500/50 text-red-200'
                      : isSelected
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#12121f] text-gray-400 hover:bg-[#1f1f35] hover:text-white border border-[#2a2a45]'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={clearSelection}
            disabled={playing}
            className="px-4 py-2 bg-[#12121f] text-gray-400 rounded-lg font-bold hover:text-white disabled:opacity-50 transition"
          >
            Clear
          </button>
          <button
            onClick={quickPick}
            disabled={playing}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold hover:bg-cyan-500/40 disabled:opacity-50 transition"
          >
            Quick Pick
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-6">
            <div className={`text-3xl font-black mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.hits} / {selectedNumbers.length} HITS
            </div>
            {result.payout > 0 && (
              <div className="text-xl text-cyan-400">{result.payout}x</div>
            )}
            <div className={`text-xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Games</div>
            <div className="flex gap-2 flex-wrap justify-center">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.hits}/{h.picks}
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
          disabled={playing || selectedNumbers.length === 0}
          balance={state.balance}
          buttonText={playing ? 'DRAWING...' : selectedNumbers.length === 0 ? 'SELECT NUMBERS' : 'PLAY'}
        >
          <div className="bg-[#12121f] rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">Selected: {selectedNumbers.length}/{MAX_PICKS}</div>
            <div className="flex flex-wrap gap-1">
              {selectedNumbers.sort((a,b) => a-b).map(n => (
                <span key={n} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </BetControls>

        {/* Payout Table */}
        {selectedNumbers.length > 0 && (
          <div className="bg-[#1a1a2e] rounded-xl p-4 mt-4">
            <div className="text-xs text-gray-500 uppercase mb-2">Payouts</div>
            <div className="space-y-1">
              {Object.entries(PAYOUTS[selectedNumbers.length] || {}).map(([hits, mult]) => (
                <div key={hits} className="flex justify-between text-sm">
                  <span className="text-gray-400">{hits} hits</span>
                  <span className="text-cyan-400 font-bold">{mult}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
