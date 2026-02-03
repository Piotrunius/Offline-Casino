import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const GRID_SIZE = 40;
const HOUSE_EDGE = 0.02;

const PAYOUT_TABLE = {
  0: 0, 1: 0, 2: 0, 3: 0.5, 4: 1, 5: 2, 6: 4, 7: 10, 8: 30, 9: 100, 10: 500
};

export default function KenoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [selectedNums, setSelectedNums] = useState([]);
  const [drawnNums, setDrawnNums] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [randomPickCount, setRandomPickCount] = useState(5);

  const toggleNum = (num) => {
    if (playing) return;
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter(n => n !== num));
    } else if (selectedNums.length < 10) {
      setSelectedNums([...selectedNums, num]);
    }
  };

  const randomPick = useCallback(() => {
    if (playing) return;
    const available = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    const picks = [];
    while (picks.length < randomPickCount) {
      const idx = Math.floor(Math.random() * available.length);
      picks.push(available.splice(idx, 1)[0]);
    }
    setSelectedNums(picks);
  }, [playing, randomPickCount]);

  const clearPicks = () => {
    if (!playing) {
      setSelectedNums([]);
      setDrawnNums([]);
      setResult(null);
    }
  };

  const play = useCallback(() => {
    if (selectedNums.length === 0 || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'keno')) return;

    setPlaying(true);
    setResult(null);
    setDrawnNums([]);
    audio.playBet();

    // Draw 10 numbers
    const available = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    const drawn = [];
    while (drawn.length < 10) {
      const idx = Math.floor(Math.random() * available.length);
      drawn.push(available.splice(idx, 1)[0]);
    }

    // Animate drawing
    const delay = state.settings.fastMode ? 100 : 300;
    drawn.forEach((num, i) => {
      setTimeout(() => {
        setDrawnNums(prev => [...prev, num]);
        audio.playCardDeal();

        if (i === drawn.length - 1) {
          // Calculate results
          setTimeout(() => {
            const hits = selectedNums.filter(n => drawn.includes(n)).length;
            const mult = PAYOUT_TABLE[hits] || 0;
            const adjustedMult = mult * (selectedNums.length / 10);

            setPlaying(false);
            if (adjustedMult > 0) {
              const win = bet * adjustedMult;
              addWin(win, bet, 'keno', adjustedMult);
              setResult({ won: true, hits, mult: adjustedMult, profit: win - bet });
              audio.playWin();
            } else {
              addWin(0, bet, 'keno', 0);
              setResult({ won: false, hits, mult: 0, profit: -bet });
              audio.playLose();
            }
          }, 300);
        }
      }, i * delay);
    });
  }, [selectedNums, bet, state.balance, state.settings.fastMode, placeBet, addWin]);

  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-3">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Grid */}
        <div className="grid grid-cols-8 gap-1 mb-4">
          {Array.from({ length: GRID_SIZE }, (_, i) => i + 1).map(num => {
            const isSelected = selectedNums.includes(num);
            const isDrawn = drawnNums.includes(num);
            const isHit = isSelected && isDrawn;

            return (
              <button key={num}
                onClick={() => toggleNum(num)}
                disabled={playing}
                className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                  isHit
                    ? 'bg-green-500 text-white ring-2 ring-yellow-400 scale-110'
                    : isDrawn
                      ? 'bg-cyan-700 text-white'
                      : isSelected
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:cursor-default`}>
                {num}
              </button>
            );
          })}
        </div>

        {/* Random Pick Controls */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-400">Random:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
              <button key={count}
                onClick={() => setRandomPickCount(count)}
                disabled={playing}
                className={`w-8 h-8 rounded text-xs font-bold ${
                  randomPickCount === count
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}>
                {count}
              </button>
            ))}
          </div>
          <button onClick={randomPick} disabled={playing}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold disabled:opacity-50">
            PICK
          </button>
          <button onClick={clearPicks} disabled={playing}
            className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold disabled:opacity-50">
            CLEAR
          </button>
        </div>

        {/* Selection Info */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <span className="text-gray-400">Selected: {selectedNums.length}/10</span>
          {drawnNums.length > 0 && (
            <span className="text-cyan-400">Drawn: {drawnNums.length}/10</span>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `${result.hits} HITS - ${result.mult.toFixed(2)}x` : `${result.hits} HITS - NO WIN`}
            </div>
            <div className="text-lg">
              {result.profit >= 0 ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {/* Play Button */}
        <button onClick={play}
          disabled={playing || selectedNums.length === 0 || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
          {playing ? 'DRAWING...' : 'PLAY'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={play} buttonText="PLAY" hideButton />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Payouts (10 picks)</div>
          <div className="space-y-1 text-xs">
            {Object.entries(PAYOUT_TABLE).filter(([, v]) => v > 0).map(([hits, mult]) => (
              <div key={hits} className="flex justify-between">
                <span>{hits} hits</span>
                <span className="text-green-400">{mult}x</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">
            * Payouts scale with number of picks
          </div>
        </div>
      </div>
    </div>
  );
}
