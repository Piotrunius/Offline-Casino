import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const HORSES = [
  { id: 1, name: 'Horse 1', color: '#ff3333' },
  { id: 2, name: 'Horse 2', color: '#3366ff' },
  { id: 3, name: 'Horse 3', color: '#ffff00' },
  { id: 4, name: 'Horse 4', color: '#00ff00' },
  { id: 5, name: 'Horse 5', color: '#ff00ff' },
  { id: 6, name: 'Horse 6', color: '#00ffff' }
];

export default function HorsesGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [selectedHorse, setSelectedHorse] = useState(1);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState(HORSES.map(() => 0));

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const startRace = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'horses')) return;

    audio.playBet();
    setRacing(true);
    setGamePhase('racing');
    setPositions(HORSES.map(() => 0));

    const interval = setInterval(() => {
      setPositions(prev => {
        const newPos = prev.map(() => Math.random() * 100);
        return newPos;
      });
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const finalPositions = HORSES.map(() => Math.random() * 100);
      setPositions(finalPositions);

      const winner = finalPositions.indexOf(Math.max(...finalPositions)) + 1;
      const won = winner === selectedHorse;
      const mult = 6;

      if (won) {
        audio.playWin();
        addWin(bet * mult, 'horses');
      } else {
        audio.playLose();
      }

      setResult({ winner, won, mult });
      setHistory(h => [{ winner, won }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setRacing(false);
    }, 3000);
  }, [bet, state.balance, placeBet, addWin, selectedHorse]);

  const newGame = () => {
    setResult(null);
    setPositions(HORSES.map(() => 0));
    setGamePhase('betting');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-5 flex flex-col justify-center gap-4">
        {/* Horses */}
        <div className="space-y-4">
          {HORSES.map((horse, idx) => (
            <div key={horse.id} className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: horse.color }} />
                  <span className="text-sm font-bold text-gray-300">{horse.name}</span>
                </div>
                {result && result.winner === horse.id && (
                  <span className="text-yellow-400 font-bold">🏆 1st</span>
                )}
              </div>
              <div className="w-full bg-gray-900 rounded-full h-6 overflow-hidden border border-gray-700">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(positions[idx], 100)}%`,
                    backgroundColor: horse.color,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold mb-2">
              {result.won ? (
                <span className="text-green-400">🎉 YOU WIN! 🎉</span>
              ) : (
                <span className="text-red-400">Horse {result.winner} wins!</span>
              )}
            </div>
            {result.won && (
              <div className="text-xl text-green-400 font-bold">+${(bet * result.mult).toFixed(0)}</div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  h.won ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {h.winner}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
        {/* Select Horse */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Select Horse</label>
          <div className="space-y-2 mt-2">
            {HORSES.map(horse => (
              <button
                key={horse.id}
                onClick={() => setSelectedHorse(horse.id)}
                disabled={racing}
                className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  selectedHorse === horse.id
                    ? 'ring-2 ring-cyan-400 scale-105'
                    : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                <div className="w-3 h-3 rounded" style={{ backgroundColor: horse.color }} />
                <span>{horse.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={racing}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
            />
          </div>
        </div>

        {/* Quick Bet */}
        <div className="grid grid-cols-3 gap-2">
          {[10, 25, 50, 100, 250, 500].map(v => (
            <button
              key={v}
              onClick={() => handleBetChange(v)}
              disabled={racing}
              className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-50`}
            >
              ${v}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {gamePhase === 'betting' ? (
          <button
            onClick={startRace}
            disabled={racing}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
          >
            {racing ? 'RACING...' : 'START RACE'}
          </button>
        ) : (
          <button
            onClick={newGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg"
          >
            NEW GAME
          </button>
        )}

        {/* Odds Info */}
        <div className="mt-auto p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
          <div className="font-bold text-cyan-400 mb-2">Payouts</div>
          <div>Correct Horse: 6:1</div>
        </div>
      </div>
    </div>
  );
}
