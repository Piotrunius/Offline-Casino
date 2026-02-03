import { useCallback, useState, useRef } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const PAYOUTS = {
  straight: 35,
  split: 17,
  red: 1,
  black: 1,
  even: 1,
  odd: 1,
  low: 1,
  high: 1,
  dozen: 2,
  column: 2
};

const BET_EXPLANATIONS = {
  'straight': 'Bet on a single number - pays 35:1',
  'red': 'Bet on all red numbers - pays 1:1',
  'black': 'Bet on all black numbers - pays 1:1',
  'even': 'Bet on even numbers (2,4,6...) - pays 1:1',
  'odd': 'Bet on odd numbers (1,3,5...) - pays 1:1',
  'low': 'Bet on numbers 1-18 - pays 1:1',
  'high': 'Bet on numbers 19-36 - pays 1:1',
  'dozen1': 'Bet on 1st dozen (1-12) - pays 2:1',
  'dozen2': 'Bet on 2nd dozen (13-24) - pays 2:1',
  'dozen3': 'Bet on 3rd dozen (25-36) - pays 2:1'
};

export default function RouletteGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('red');
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode;

  const getColor = (num) => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const checkWin = (winningNumber, type, number) => {
    switch (type) {
      case 'straight': return winningNumber === number;
      case 'red': return RED_NUMBERS.includes(winningNumber);
      case 'black': return winningNumber !== 0 && !RED_NUMBERS.includes(winningNumber);
      case 'even': return winningNumber !== 0 && winningNumber % 2 === 0;
      case 'odd': return winningNumber % 2 === 1;
      case 'low': return winningNumber >= 1 && winningNumber <= 18;
      case 'high': return winningNumber >= 19 && winningNumber <= 36;
      case 'dozen1': return winningNumber >= 1 && winningNumber <= 12;
      case 'dozen2': return winningNumber >= 13 && winningNumber <= 24;
      case 'dozen3': return winningNumber >= 25 && winningNumber <= 36;
      default: return false;
    }
  };

  const getPayout = (type) => {
    if (type === 'straight') return PAYOUTS.straight;
    if (type.startsWith('dozen')) return PAYOUTS.dozen;
    return PAYOUTS[type] || 1;
  };

  const spin = useCallback(async () => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (betType === 'straight' && selectedNumber === null) return;

    const confirmed = await placeBet(bet, 'roulette');
    if (!confirmed) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    let winningNumber;
    if (godMode) {
      winningNumber = betType === 'straight' ? selectedNumber : 
        betType === 'red' ? RED_NUMBERS[Math.floor(Math.random() * RED_NUMBERS.length)] :
        betType === 'black' ? [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35][Math.floor(Math.random() * 18)] :
        betType === 'even' ? [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36][Math.floor(Math.random() * 18)] :
        betType === 'odd' ? [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35][Math.floor(Math.random() * 18)] :
        betType === 'low' ? Math.floor(Math.random() * 18) + 1 :
        betType === 'high' ? Math.floor(Math.random() * 18) + 19 :
        betType === 'dozen1' ? Math.floor(Math.random() * 12) + 1 :
        betType === 'dozen2' ? Math.floor(Math.random() * 12) + 13 :
        Math.floor(Math.random() * 12) + 25;
    } else {
      winningNumber = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    }

    const winningIndex = NUMBERS.indexOf(winningNumber);
    const duration = state.settings.fastMode ? 2000 : 4000;
    const startTime = Date.now();
    const startWheelRotation = wheelRotation;
    const wheelSpins = 3;
    const ballSpins = 8;
    const numberAngle = (winningIndex / NUMBERS.length) * 360;
    const targetWheelRotation = startWheelRotation + wheelSpins * 360;
    const targetBallRotation = ballSpins * 360 + numberAngle;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 4);

      setWheelRotation(startWheelRotation + (targetWheelRotation - startWheelRotation) * ease);
      setBallRotation(targetBallRotation * ease);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const won = checkWin(winningNumber, betType, selectedNumber);
        const payout = getPayout(betType);

        setHistory(h => [{ number: winningNumber, color: getColor(winningNumber) }, ...h.slice(0, 3)]);

        if (won) {
          const winAmount = bet * (payout + 1);
          addWin(winAmount, bet, 'roulette', payout + 1);
          setResult({ won: true, number: winningNumber, color: getColor(winningNumber), profit: winAmount - bet });
          audio.playWin();
        } else {
          addWin(0, bet, 'roulette', 0);
          setResult({ won: false, number: winningNumber, color: getColor(winningNumber), profit: -bet });
          audio.playLose();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, bet, state.balance, betType, selectedNumber, wheelRotation, godMode, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col">
        {/* Roulette Wheel */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="relative w-72 h-72">
            {/* Wheel */}
            <div 
              className="absolute inset-0 rounded-full border-8 border-amber-900 shadow-2xl"
              style={{ 
                background: 'conic-gradient(from 0deg, ' + 
                  NUMBERS.map((n, i) => {
                    const color = n === 0 ? '#00aa00' : RED_NUMBERS.includes(n) ? '#cc0000' : '#111111';
                    const start = (i / NUMBERS.length) * 100;
                    const end = ((i + 1) / NUMBERS.length) * 100;
                    return `${color} ${start}% ${end}%`;
                  }).join(', ') + ')',
                transform: `rotate(${wheelRotation}deg)`,
                transition: spinning ? 'none' : 'transform 0.3s'
              }}
            >
              {/* Numbers on wheel */}
              {NUMBERS.map((n, i) => {
                const angle = (i / NUMBERS.length) * 360;
                return (
                  <span
                    key={i}
                    className="absolute text-[10px] font-bold text-white"
                    style={{
                      left: '50%',
                      top: '8px',
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                      transformOrigin: '50% 128px'
                    }}
                  >
                    {n}
                  </span>
                );
              })}
            </div>
            
            {/* Ball */}
            <div
              className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
              style={{
                left: '50%',
                top: '20px',
                marginLeft: '-8px',
                transform: `rotate(${-ballRotation}deg)`,
                transformOrigin: '8px 124px',
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
              }}
            />
            
            {/* Center */}
            <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-4 border-amber-600 flex items-center justify-center">
              <span className="text-amber-200 font-bold text-sm">SPIN</span>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-3 rounded-xl ${result.won ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <div className="flex items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                result.color === 'red' ? 'bg-red-600' : result.color === 'black' ? 'bg-gray-900' : 'bg-green-600'
              }`}>
                {result.number}
              </div>
              <div>
                <span className={`text-xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
                  {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Betting Table */}
        <div className="mt-4 bg-green-900/20 rounded-xl p-3">
          {/* Numbers Grid */}
          <div className="grid grid-cols-13 gap-1 mb-3">
            <button
              onClick={() => { setBetType('straight'); setSelectedNumber(0); }}
              className={`col-span-1 row-span-3 p-2 rounded text-white text-xs font-bold bg-green-600 hover:bg-green-500 transition-all ${
                betType === 'straight' && selectedNumber === 0 ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              0
            </button>
            {[...Array(36)].map((_, i) => {
              const n = i + 1;
              const isRed = RED_NUMBERS.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => { setBetType('straight'); setSelectedNumber(n); }}
                  className={`p-1 rounded text-white text-xs font-bold transition-all ${
                    isRed ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-800 hover:bg-gray-700'
                  } ${betType === 'straight' && selectedNumber === n ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Outside Bets */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { type: 'red', label: 'RED', color: 'bg-red-600' },
              { type: 'black', label: 'BLACK', color: 'bg-gray-800' },
              { type: 'even', label: 'EVEN', color: 'bg-gray-700' },
              { type: 'odd', label: 'ODD', color: 'bg-gray-700' },
              { type: 'low', label: '1-18', color: 'bg-gray-700' },
              { type: 'high', label: '19-36', color: 'bg-gray-700' },
            ].map(b => (
              <button
                key={b.type}
                onClick={() => { setBetType(b.type); setSelectedNumber(null); }}
                className={`py-2 rounded text-white text-xs font-bold transition-all ${b.color} hover:opacity-80 group relative cursor-help ${
                  betType === b.type ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {b.label}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 w-40 z-10 whitespace-normal font-normal">
                  {BET_EXPLANATIONS[b.type]}
                </div>
              </button>
            ))}
          </div>

          {/* Dozens */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['1st 12', '2nd 12', '3rd 12'].map((label, i) => (
              <button
                key={i}
                onClick={() => { setBetType(`dozen${i + 1}`); setSelectedNumber(null); }}
                className={`py-2 rounded text-white text-xs font-bold bg-gray-700 hover:bg-gray-600 transition-all group relative cursor-help ${
                  betType === `dozen${i + 1}` ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {label}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 w-40 z-10 whitespace-normal font-normal">
                  {BET_EXPLANATIONS[`dozen${i + 1}`]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4">
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
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button onClick={() => handleBetChange(1)} disabled={spinning} className="btn-secondary py-2 text-sm font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={spinning} className="btn-secondary py-2 text-sm font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={spinning} className="btn-secondary py-2 text-sm font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={spinning} className="btn-secondary py-2 text-sm font-bold">MAX</button>
          </div>
        </div>

        {/* Current Bet Info */}
        <div className="bg-black/30 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Current Bet</div>
          <div className="text-white font-bold">
            {betType === 'straight' ? `Number ${selectedNumber ?? '?'}` : betType.toUpperCase()}
          </div>
          <div className="text-green-400 text-sm">
            Payout: {getPayout(betType) + 1}x
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={spinning || bet <= 0 || bet > state.balance || (betType === 'straight' && selectedNumber === null)}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            spinning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
          }`}
        >
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">History</div>
            <div className="flex gap-2">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    h.color === 'red' ? 'bg-red-600' : h.color === 'black' ? 'bg-gray-800' : 'bg-green-600'
                  }`}
                >
                  {h.number}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
