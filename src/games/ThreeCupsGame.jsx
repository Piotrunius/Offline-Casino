import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const CUPS = [
  { id: 0, name: 'Left Cup' },
  { id: 1, name: 'Center Cup' },
  { id: 2, name: 'Right Cup' }
];

export default function ThreeCupsGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [selectedCup, setSelectedCup] = useState(null);
  const [gamePhase, setGamePhase] = useState('betting');
  const [ballCup, setBallCup] = useState(null);
  const [reveal, setReveal] = useState([false, false, false]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [shuffling, setShuffling] = useState(false);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'threecups')) return;

    audio.playBet();
    setShuffling(true);
    setGamePhase('shuffling');
    setSelectedCup(null);
    setReveal([false, false, false]);
    setResult(null);

    // Shuffle animation
    const shuffleCount = 15;
    let current = 0;

    const interval = setInterval(() => {
      if (current < shuffleCount) {
        setBallCup(Math.floor(Math.random() * 3));
        current++;
      } else {
        clearInterval(interval);
        const finalBall = Math.floor(Math.random() * 3);
        setBallCup(finalBall);
        setShuffling(false);
        setGamePhase('selecting');
      }
    }, 100);
  }, [bet, state.balance, placeBet]);

  const selectCup = (cupId) => {
    if (gamePhase !== 'selecting' || selectedCup !== null) return;

    setSelectedCup(cupId);
    setGamePhase('revealing');

    setTimeout(() => {
      const newReveal = [true, true, true];
      setReveal(newReveal);

      const won = cupId === ballCup;

      if (won) {
        audio.playWin();
        addWin(bet * 3, 'threecups');
      } else {
        audio.playLose();
      }

      setResult({ won, correctCup: ballCup });
      setHistory(h => [{ won }, ...h.slice(0, 4)]);
      setGamePhase('result');
    }, 500);
  };

  const newGame = () => {
    setBallCup(null);
    setSelectedCup(null);
    setReveal([false, false, false]);
    setResult(null);
    setGamePhase('betting');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-5 flex flex-col items-center justify-center gap-8">
        {/* Game Title */}
        <div className="text-center">
          <div className="text-xl font-bold text-cyan-400 mb-2">
            {gamePhase === 'betting' && 'Place Your Bet'}
            {gamePhase === 'shuffling' && '🎯 Watch the Cups...'}
            {gamePhase === 'selecting' && '👉 Pick a Cup!'}
            {gamePhase === 'revealing' && '✨ Revealing...'}
            {gamePhase === 'result' && (result?.won ? '🎉 YOU WIN! 🎉' : '❌ Try Again')}
          </div>
        </div>

        {/* Cups */}
        <div className="flex gap-8 items-end">
          {CUPS.map(cup => (
            <button
              key={cup.id}
              onClick={() => selectCup(cup.id)}
              disabled={gamePhase !== 'selecting' || selectedCup !== null}
              className="relative group transition-all hover:scale-105"
            >
              {/* Cup */}
              <div
                className={`w-28 h-40 rounded-t-3xl rounded-b-lg transition-all transform ${
                  reveal[cup.id]
                    ? selectedCup === cup.id
                      ? 'bg-yellow-500'
                      : 'bg-gray-600'
                    : 'bg-gradient-to-b from-red-600 to-red-800'
                } ${selectedCup === cup.id ? 'scale-110 shadow-2xl' : ''}`}
              >
                {/* Ball inside if revealed */}
                {reveal[cup.id] && ballCup === cup.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 bg-yellow-300 rounded-full shadow-lg" />
                  </div>
                )}
                {reveal[cup.id] && ballCup !== cup.id && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    ∅
                  </div>
                )}
              </div>

              {/* Cup Label */}
              <div className="text-center mt-2 text-sm font-bold text-gray-300">
                {cup.name}
              </div>

              {/* Selection Indicator */}
              {selectedCup === cup.id && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400" />
              )}
            </button>
          ))}
        </div>

        {/* Result Message */}
        {result && (
          <div className={`text-center p-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-bold mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${(bet * 3).toFixed(0)}` : 'Lost Bet'}
            </div>
            {result.won && (
              <div className="text-cyan-400">Correct cup was #{result.correctCup + 1}</div>
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
                {h.won ? '✓' : '✗'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={gamePhase !== 'betting'}
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
              disabled={gamePhase !== 'betting'}
              className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-50`}
            >
              ${v}
            </button>
          ))}
        </div>

        {/* How to Play */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-cyan-400 mb-2">How to Play</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>1. Place your bet</div>
            <div>2. Watch the cups shuffle</div>
            <div>3. Pick the cup with the ball</div>
            <div>4. Win 3x your bet!</div>
          </div>
        </div>

        {/* Action Button */}
        {gamePhase === 'betting' ? (
          <button
            onClick={startGame}
            disabled={shuffling}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 mt-auto"
          >
            {shuffling ? 'SHUFFLING...' : 'START GAME'}
          </button>
        ) : (
          <button
            onClick={newGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg mt-auto"
          >
            NEW GAME
          </button>
        )}

        {/* Stats */}
        <div className="text-xs text-gray-500 text-center">
          <div>Your Balance: <span className="text-cyan-400 font-bold">${state.balance.toFixed(0)}</span></div>
        </div>
      </div>
    </div>
  );
}
