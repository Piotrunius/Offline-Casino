import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const WHEEL_NUMBERS = [
  { n: 0, c: 'green' }, { n: 32, c: 'red' }, { n: 15, c: 'black' }, { n: 19, c: 'red' },
  { n: 4, c: 'black' }, { n: 21, c: 'red' }, { n: 2, c: 'black' }, { n: 25, c: 'red' },
  { n: 17, c: 'black' }, { n: 34, c: 'red' }, { n: 6, c: 'black' }, { n: 27, c: 'red' },
  { n: 13, c: 'black' }, { n: 36, c: 'red' }, { n: 11, c: 'black' }, { n: 30, c: 'red' },
  { n: 8, c: 'black' }, { n: 23, c: 'red' }, { n: 10, c: 'black' }, { n: 5, c: 'red' },
  { n: 24, c: 'black' }, { n: 16, c: 'red' }, { n: 33, c: 'black' }, { n: 1, c: 'red' },
  { n: 20, c: 'black' }, { n: 14, c: 'red' }, { n: 31, c: 'black' }, { n: 9, c: 'red' },
  { n: 22, c: 'black' }, { n: 18, c: 'red' }, { n: 29, c: 'black' }, { n: 7, c: 'red' },
  { n: 28, c: 'black' }, { n: 12, c: 'red' }, { n: 35, c: 'black' }, { n: 3, c: 'red' },
  { n: 26, c: 'black' }
];

const BET_TYPES = {
  red: { label: 'RED', mult: 2, check: n => WHEEL_NUMBERS.find(x => x.n === n)?.c === 'red' },
  black: { label: 'BLACK', mult: 2, check: n => WHEEL_NUMBERS.find(x => x.n === n)?.c === 'black' },
  green: { label: 'GREEN', mult: 36, check: n => n === 0 },
  odd: { label: 'ODD', mult: 2, check: n => n > 0 && n % 2 === 1 },
  even: { label: 'EVEN', mult: 2, check: n => n > 0 && n % 2 === 0 },
  low: { label: '1-18', mult: 2, check: n => n >= 1 && n <= 18 },
  high: { label: '19-36', mult: 2, check: n => n >= 19 && n <= 36 }
};

export default function RouletteGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('red');
  const [spinning, setSpinning] = useState(false);
  const [wheelRot, setWheelRot] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const segAngle = 360 / WHEEL_NUMBERS.length;

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'roulette')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Pick winning number
    const winIdx = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const winNum = WHEEL_NUMBERS[winIdx];

    const duration = state.settings.fastMode ? 2500 : 4500;
    const wheelSpins = 3 + Math.floor(Math.random() * 2);
    const ballSpins = 5 + Math.floor(Math.random() * 3);

    // Final positions
    const finalWheelRot = wheelRot + wheelSpins * 360;
    const winSegmentAngle = winIdx * segAngle;
    const finalBallAngle = ballAngle + ballSpins * 360 + (360 - winSegmentAngle - segAngle / 2);

    const start = Date.now();
    const startWheelRot = wheelRot;
    const startBallAngle = ballAngle;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const wheelEase = 1 - Math.pow(1 - progress, 2);
      const ballEase = 1 - Math.pow(1 - progress, 4);

      setWheelRot(startWheelRot + (finalWheelRot - startWheelRot) * wheelEase);
      setBallAngle(startBallAngle + (finalBallAngle - startBallAngle) * ballEase);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);

        const won = BET_TYPES[betType].check(winNum.n);
        const mult = won ? BET_TYPES[betType].mult : 0;
        const winAmount = bet * mult;

        setResult({ number: winNum.n, color: winNum.c, won, mult, win: winAmount });
        setHistory(h => [{ n: winNum.n, c: winNum.c }, ...h.slice(0, 4)]);

        if (won) {
          addWin(winAmount, bet, 'roulette', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'roulette', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [spinning, bet, state.balance, betType, wheelRot, ballAngle, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-2 flex flex-col items-center justify-center">
        <svg viewBox="0 0 220 220" className="w-full max-w-[280px] max-h-[280px]">
          {/* Outer ring */}
          <circle cx="110" cy="110" r="105" fill="#1a1008" stroke="#8b7355" strokeWidth="3" />
          <circle cx="110" cy="110" r="95" fill="#111" />

          {/* Wheel */}
          <g transform={`rotate(${wheelRot} 110 110)`}>
            {WHEEL_NUMBERS.map((num, i) => {
              const startA = (i * segAngle - 90) * Math.PI / 180;
              const endA = ((i + 1) * segAngle - 90) * Math.PI / 180;
              const x1 = 110 + 85 * Math.cos(startA);
              const y1 = 110 + 85 * Math.sin(startA);
              const x2 = 110 + 85 * Math.cos(endA);
              const y2 = 110 + 85 * Math.sin(endA);

              const midA = (startA + endA) / 2;
              const textX = 110 + 70 * Math.cos(midA);
              const textY = 110 + 70 * Math.sin(midA);

              return (
                <g key={i}>
                  <path
                    d={`M 110 110 L ${x1} ${y1} A 85 85 0 0 1 ${x2} ${y2} Z`}
                    fill={num.c === 'green' ? '#00aa55' : num.c === 'red' ? '#cc0000' : '#111'}
                    stroke="#c9a73f"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="6"
                    fontWeight="bold"
                    transform={`rotate(${i * segAngle} ${textX} ${textY})`}
                  >
                    {num.n}
                  </text>
                </g>
              );
            })}
            <circle cx="110" cy="110" r="25" fill="#2a1810" stroke="#c9a73f" strokeWidth="2" />
          </g>

          {/* Ball */}
          <circle
            cx={110 + 75 * Math.cos((ballAngle - 90) * Math.PI / 180)}
            cy={110 + 75 * Math.sin((ballAngle - 90) * Math.PI / 180)}
            r="5"
            fill="#eee"
            stroke="#999"
            strokeWidth="1"
          />
        </svg>

        {/* Result */}
        {result && (
          <div className={`mt-2 text-center py-2 px-4 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-3xl font-black ${result.color === 'red' ? 'text-red-500' : result.color === 'green' ? 'text-green-500' : 'text-white'}`}>
              {result.number}
            </div>
            <div className={`text-sm ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${(result.win - bet).toFixed(2)}` : `-$${bet.toFixed(2)}`}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-1 mt-2">
            {history.map((h, i) => (
              <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${h.c === 'red' ? 'bg-red-600' : h.c === 'green' ? 'bg-green-600' : 'bg-gray-800'}`}>
                {h.n}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-2">
          {/* Bet Type */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Type</label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button onClick={() => !spinning && setBetType('red')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'red' ? 'bg-red-600 text-white' : 'bg-gray-800 text-red-400'}`}>
                RED
              </button>
              <button onClick={() => !spinning && setBetType('black')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'black' ? 'bg-gray-900 text-white ring-2 ring-white' : 'bg-gray-800 text-gray-400'}`}>
                BLACK
              </button>
              <button onClick={() => !spinning && setBetType('green')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'green' ? 'bg-green-600 text-white' : 'bg-gray-800 text-green-400'}`}>
                GREEN 0
              </button>
              <button onClick={() => !spinning && setBetType('odd')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'odd' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                ODD
              </button>
              <button onClick={() => !spinning && setBetType('even')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'even' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                EVEN
              </button>
              <button onClick={() => !spinning && setBetType('low')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm ${betType === 'low' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                1-18
              </button>
              <button onClick={() => !spinning && setBetType('high')} disabled={spinning}
                className={`py-2 rounded-lg font-bold text-sm col-span-2 ${betType === 'high' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                19-36
              </button>
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
                disabled={spinning}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={spinning} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={spinning} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={spinning} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={spinning} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-cyan-400 font-bold">{BET_TYPES[betType].mult}x</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Win Amount</span>
              <span className="text-green-400 font-bold">${(bet * BET_TYPES[betType].mult).toFixed(2)}</span>
            </div>
          </div>

          {/* Spin */}
          <button
            onClick={spin}
            disabled={spinning || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
