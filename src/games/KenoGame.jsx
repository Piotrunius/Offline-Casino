import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const GRID_SIZE = 40;
const PICKS = { 1: 3.8, 2: 2.5, 3: 2, 4: 1.5, 5: 1.4, 6: 1.3, 7: 1.2, 8: 1.15, 9: 1.1, 10: 1.08 };
const HITS_MULTIPLIERS = {
  1: { 1: 3.8 },
  2: { 1: 1, 2: 6 },
  3: { 1: 0.5, 2: 2, 3: 10 },
  4: { 1: 0.3, 2: 1, 3: 3.5, 4: 15 },
  5: { 1: 0.2, 2: 0.6, 3: 2, 4: 7, 5: 25 },
  6: { 1: 0.2, 2: 0.4, 3: 1.2, 4: 3.5, 5: 12, 6: 40 },
  7: { 1: 0.2, 2: 0.3, 3: 0.8, 4: 2, 5: 6, 6: 20, 7: 60 },
  8: { 1: 0.1, 2: 0.2, 3: 0.5, 4: 1.4, 5: 3.5, 6: 10, 7: 35, 8: 100 },
  9: { 1: 0.1, 2: 0.2, 3: 0.4, 4: 0.9, 5: 2.2, 6: 5.5, 7: 18, 8: 60, 9: 150 },
  10: { 1: 0.1, 2: 0.1, 3: 0.3, 4: 0.6, 5: 1.5, 6: 3.5, 7: 10, 8: 35, 9: 100, 10: 200 },
};

export default function KenoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [drawn, setDrawn] = useState(new Set());
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState('selecting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const hits = [...selected].filter(n => drawn.has(n)).length;
  const pickCount = selected.size;
  const multiplierTable = HITS_MULTIPLIERS[pickCount] || {};

  const toggleNumber = (num) => {
    if (phase !== 'selecting') return;

    const newSelected = new Set(selected);
    if (newSelected.has(num)) {
      newSelected.delete(num);
    } else if (newSelected.size < 10) {
      newSelected.add(num);
    }
    setSelected(newSelected);
  };

  const clearSelection = () => {
    if (phase !== 'selecting') return;
    setSelected(new Set());
  };

  const randomPick = () => {
    if (phase !== 'selecting') return;

    const count = selected.size || 5;
    const newSelected = new Set();
    while (newSelected.size < Math.min(count, 10)) {
      newSelected.add(Math.floor(Math.random() * GRID_SIZE) + 1);
    }
    setSelected(newSelected);
  };

  const play = useCallback(() => {
    if (playing || selected.size === 0 || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'keno')) return;

    setPlaying(true);
    setDrawn(new Set());
    setResult(null);
    setPhase('drawing');
    audio.playBet();

    // Draw 10 random numbers
    const drawnNumbers = [];
    while (drawnNumbers.length < 10) {
      const num = Math.floor(Math.random() * GRID_SIZE) + 1;
      if (!drawnNumbers.includes(num)) drawnNumbers.push(num);
    }

    // Animate drawing
    const delay = state.settings.fastMode ? 100 : 300;
    drawnNumbers.forEach((num, i) => {
      setTimeout(() => {
        setDrawn(prev => new Set([...prev, num]));
        audio.playTick();

        if (i === drawnNumbers.length - 1) {
          // Calculate result
          const finalHits = [...selected].filter(n => drawnNumbers.includes(n)).length;
          const mult = multiplierTable[finalHits] || 0;
          const won = mult > 0;

          setTimeout(() => {
            if (won) {
              const winAmount = bet * mult;
              addWin(winAmount, bet, 'keno', mult);
              audio.playWin();
              setResult({ won: true, hits: finalHits, multiplier: mult, profit: winAmount - bet });
            } else {
              addWin(0, bet, 'keno', 0);
              audio.playLose();
              setResult({ won: false, hits: finalHits, profit: -bet });
            }

            setHistory(h => [{ won, hits: finalHits, picks: selected.size }, ...h.slice(0, 9)]);
            setPlaying(false);
            setPhase('finished');
          }, 300);
        }
      }, (i + 1) * delay);
    });
  }, [selected, bet, state.balance, state.settings.fastMode, placeBet, addWin, playing, multiplierTable]);

  const newGame = () => {
    setPhase('selecting');
    setDrawn(new Set());
    setResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Stats */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400 text-sm">Selected</div>
            <div className="text-3xl font-black text-cyan-400">{selected.size}/10</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Hits</div>
            <div className="text-3xl font-black text-green-400">{hits}</div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-8 gap-1.5 mb-6">
          {Array.from({ length: GRID_SIZE }, (_, i) => i + 1).map(num => {
            const isSelected = selected.has(num);
            const isDrawn = drawn.has(num);
            const isHit = isSelected && isDrawn;

            let bgColor = 'bg-gray-700 hover:bg-gray-600';
            if (isHit) {
              bgColor = 'bg-green-600';
            } else if (isSelected) {
              bgColor = 'bg-cyan-600';
            } else if (isDrawn) {
              bgColor = 'bg-yellow-600/50';
            }

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={phase !== 'selecting'}
                className={`aspect-square rounded-lg font-bold text-sm ${bgColor} text-white transition-all`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-4">
            <div className={`text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `${result.hits} HITS! ${result.multiplier}x` : `${result.hits} HITS - NO WIN`}
            </div>
            {result.won && (
              <div className="text-xl text-green-400">+${result.profit.toFixed(2)}</div>
            )}
          </div>
        )}

        {/* Controls */}
        {phase === 'selecting' && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button onClick={clearSelection} className="py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
              CLEAR
            </button>
            <button onClick={randomPick} className="py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold">
              RANDOM
            </button>
            <button
              onClick={play}
              disabled={selected.size === 0 || bet <= 0 || bet > state.balance}
              className="py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
            >
              PLAY
            </button>
          </div>
        )}

        {phase === 'finished' && (
          <div className="flex justify-center">
            <button onClick={newGame} className="btn-primary px-8 py-3 font-bold text-lg">
              NEW GAME
            </button>
          </div>
        )}

        {/* Payout table */}
        {pickCount > 0 && (
          <div className="mt-4 bg-gray-800/50 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase mb-2">Payouts for {pickCount} picks</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(HITS_MULTIPLIERS[pickCount] || {}).map(([h, m]) => (
                <div
                  key={h}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    parseInt(h) === hits && phase === 'finished'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {h}→{m}x
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={play} buttonText="PLAY" hideButton />

        {/* Quick picks */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Quick Pick</div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => {
                  if (phase !== 'selecting') return;
                  const newSelected = new Set();
                  while (newSelected.size < n) {
                    newSelected.add(Math.floor(Math.random() * GRID_SIZE) + 1);
                  }
                  setSelected(newSelected);
                }}
                disabled={phase !== 'selecting'}
                className="py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{h.won ? 'WIN' : 'LOST'}</span>
                  <span>{h.hits}/{h.picks} hits</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
