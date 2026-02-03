import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const COLORS = {
  0: 'green',
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
};

const getColor = (num) => {
  if (num === 0) return 'green';
  return COLORS.red.includes(num) ? 'red' : 'black';
};

export default function RouletteGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('number'); // number, color, evenodd
  const [betValue, setBetValue] = useState(1);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);
  const [history, setHistory] = useState([]);
  const [spinning, setSpinning] = useState(false);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const spin = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'roulette')) return;

    audio.playBet();
    setSpinning(true);
    setGamePhase('spinning');

    setTimeout(() => {
      const number = Math.floor(Math.random() * 37);
      const color = getColor(number);
      setWinningNumber(number);

      let won = false;
      let mult = 0;

      if (betType === 'number' && betValue === number) {
        mult = 36;
        won = true;
      } else if (betType === 'color') {
        if ((betValue === 'red' && color === 'red') || (betValue === 'black' && color === 'black')) {
          mult = 2;
          won = true;
        }
      } else if (betType === 'evenodd') {
        const isEven = number !== 0 && number % 2 === 0;
        const isOdd = number !== 0 && number % 2 !== 0;
        if ((betValue === 'even' && isEven) || (betValue === 'odd' && isOdd)) {
          mult = 2;
          won = true;
        }
      }

      if (won) {
        audio.playWin();
        addWin(bet * mult, 'roulette');
      } else {
        audio.playLose();
      }

      setResult({ number, color, won, mult });
      setHistory(h => [{ number, color, won }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setSpinning(false);
    }, 2500);
  }, [bet, state.balance, placeBet, addWin, betType, betValue]);

  const newGame = () => {
    setWinningNumber(null);
    setResult(null);
    setGamePhase('betting');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-5 flex flex-col items-center justify-center">
        {/* Roulette Wheel */}
        <div className="relative w-64 h-64 mb-4">
          <div className={`w-full h-full rounded-full border-8 border-yellow-500 flex items-center justify-center transition-transform ${spinning ? 'animate-spin' : ''}`} style={spinning ? { animationDuration: '2s' } : {}}>
            <div className="w-56 h-56 rounded-full grid grid-cols-6 gap-1 p-2 bg-gray-900">
              {NUMBERS.map(num => {
                const color = getColor(num);
                const isWinning = winningNumber === num;
                return (
                  <div
                    key={num}
                    className={`flex items-center justify-center text-xs font-bold rounded-full transition-all ${
                      color === 'red' ? 'bg-red-600' : color === 'black' ? 'bg-gray-800' : 'bg-green-600'
                    } ${isWinning ? 'ring-4 ring-yellow-300 scale-110' : 'text-white'}`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-yellow-400" />
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{result.number}</div>
            <div className={`text-xl font-bold ${result.color === 'red' ? 'text-red-400' : result.color === 'black' ? 'text-gray-300' : 'text-green-400'}`}>
              {result.color.toUpperCase()}
            </div>
            <div className={`text-2xl font-bold mt-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+${(bet * result.mult).toFixed(0)}` : 'LOSE'}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            {history.map((h, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110 ${
                  h.color === 'red' ? 'bg-red-600' : h.color === 'black' ? 'bg-gray-700' : 'bg-green-600'
                }`}
              >
                {h.number}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
        {/* Bet Type Selection */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Type</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { val: 'number', label: 'Number' },
              { val: 'color', label: 'Color' },
              { val: 'evenodd', label: 'Even/Odd' }
            ].map(b => (
              <button
                key={b.val}
                onClick={() => setBetType(b.val)}
                disabled={spinning}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  betType === b.val ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Value Selection */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet On</label>
          {betType === 'number' && (
            <div className="grid grid-cols-6 gap-1 mt-2 max-h-32 overflow-y-auto">
              {NUMBERS.map(n => (
                <button
                  key={n}
                  onClick={() => setBetValue(n)}
                  disabled={spinning}
                  className={`py-1 rounded text-xs font-bold transition-all ${
                    betValue === n ? 'bg-cyan-600 text-white' : `${getColor(n) === 'red' ? 'bg-red-600' : getColor(n) === 'black' ? 'bg-gray-700' : 'bg-green-600'} text-white`
                  } disabled:opacity-50`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {betType === 'color' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[{ val: 'red', label: 'Red' }, { val: 'black', label: 'Black' }].map(c => (
                <button
                  key={c.val}
                  onClick={() => setBetValue(c.val)}
                  disabled={spinning}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    betValue === c.val ? 'ring-2 ring-cyan-400 scale-105' : ''
                  } ${c.val === 'red' ? 'bg-red-600' : 'bg-gray-700'} text-white disabled:opacity-50`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {betType === 'evenodd' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[{ val: 'even', label: 'Even' }, { val: 'odd', label: 'Odd' }].map(e => (
                <button
                  key={e.val}
                  onClick={() => setBetValue(e.val)}
                  disabled={spinning}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    betValue === e.val ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          )}
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
              disabled={spinning}
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
              disabled={spinning}
              className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-50`}
            >
              ${v}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {gamePhase === 'betting' ? (
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        ) : (
          <button
            onClick={newGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg"
          >
            NEW GAME
          </button>
        )}
      </div>
    </div>
  );
}
