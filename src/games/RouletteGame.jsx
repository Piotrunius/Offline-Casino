import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// European roulette wheel layout (numbers in order around wheel)
const NUMBERS = [
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
  red: { label: 'RED', mult: 2, check: n => NUMBERS.find(x => x.n === n)?.c === 'red' },
  black: { label: 'BLACK', mult: 2, check: n => NUMBERS.find(x => x.n === n)?.c === 'black' },
  green: { label: 'GREEN 0', mult: 36, check: n => n === 0 },
  odd: { label: 'ODD', mult: 2, check: n => n > 0 && n % 2 === 1 },
  even: { label: 'EVEN', mult: 2, check: n => n > 0 && n % 2 === 0 },
  low: { label: '1-18', mult: 2, check: n => n >= 1 && n <= 18 },
  high: { label: '19-36', mult: 2, check: n => n >= 19 && n <= 36 }
};

const HOUSE_EDGE = 0.027;

export default function RouletteGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(() => Math.floor(state.balance * 0.05) || 10);
  const [betType, setBetType] = useState('red');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [winningNumber, setWinningNumber] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const wheelRotRef = useRef(0);
  const ballAngleRef = useRef(0);

  const segAngle = 360 / NUMBERS.length;

  const drawRoulette = useCallback((wheelRot, ballAngle, showBall = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 35;

    ctx.clearRect(0, 0, size, size);

    // Outer wood frame
    ctx.beginPath();
    ctx.arc(cx, cy, r + 30, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1810';
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ball track
    ctx.beginPath();
    ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // Wheel background
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((wheelRot * Math.PI) / 180);

    // Draw segments
    NUMBERS.forEach((num, i) => {
      const startAngle = (i * segAngle - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * segAngle - 90) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = num.c === 'green' ? '#00aa55' : num.c === 'red' ? '#cc0000' : '#111';
      ctx.fill();
      ctx.strokeStyle = '#c9a73f';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number label
      ctx.save();
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.translate(r * 0.8, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(num.n.toString(), 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#c9a73f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner decorative circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Ball
    if (showBall) {
      const ballDist = r + 10;
      const ballRad = (ballAngle - 90) * Math.PI / 180;
      const ballX = cx + Math.cos(ballRad) * ballDist;
      const ballY = cy + Math.sin(ballRad) * ballDist;

      // Ball shadow
      ctx.beginPath();
      ctx.arc(ballX + 2, ballY + 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 0, ballX, ballY, 8);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.5, '#e0e0e0');
      ballGrad.addColorStop(1, '#a0a0a0');
      ctx.fillStyle = ballGrad;
      ctx.fill();
    }
  }, [segAngle]);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'roulette')) return;

    setSpinning(true);
    setResult(null);
    setWinningNumber(null);
    audio.playBet();

    // Pick random winning number
    const resultIdx = Math.floor(Math.random() * NUMBERS.length);
    const resultNum = NUMBERS[resultIdx];

    // FIXED: Proper ball and wheel animation
    // Ball spins opposite to wheel, then lands in the winning segment
    const wheelSpins = 2 + Math.random();
    const ballSpins = 5 + Math.random() * 2;

    // Calculate final positions
    // The winning segment center angle on the wheel
    const segmentCenterAngle = resultIdx * segAngle + segAngle / 2;

    // Final wheel position (arbitrary, just needs to spin)
    const finalWheelRot = wheelRotRef.current + wheelSpins * 360;

    // FIXED: Ball must land on the segment that corresponds to resultIdx
    // Ball angle relative to screen = wheel rotation + segment position
    // Since ball is on outer track, it needs to align with the segment
    const finalBallAngle = finalWheelRot + segmentCenterAngle;

    const startWheelRot = wheelRotRef.current;
    const startBallAngle = ballAngleRef.current;
    const duration = state.settings.fastMode ? 3500 : 6000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Easing functions
      const wheelEase = 1 - Math.pow(1 - progress, 3);
      const ballEase = 1 - Math.pow(1 - progress, 5);

      const currentWheelRot = startWheelRot + (finalWheelRot - startWheelRot) * wheelEase;

      // Ball spins faster in opposite direction initially, then settles
      const ballTotalRotation = ballSpins * 360 * (progress < 0.5 ? -1 : 1);
      const currentBallAngle = progress < 0.3
        ? startBallAngle - elapsed * 0.5 // Fast opposite spin
        : startBallAngle + (finalBallAngle - startBallAngle) * ballEase;

      wheelRotRef.current = currentWheelRot;
      ballAngleRef.current = currentBallAngle;

      drawRoulette(currentWheelRot, currentBallAngle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinningNumber(resultNum);

        const won = BET_TYPES[betType].check(resultNum.n);
        if (won) {
          const mult = BET_TYPES[betType].mult;
          const win = bet * mult;
          addWin(win, bet, 'roulette', mult);
          audio.playWin();
          setResult({ won: true, number: resultNum.n, color: resultNum.c, profit: win - bet });
        } else {
          addWin(0, bet, 'roulette', 0);
          audio.playLose();
          setResult({ won: false, number: resultNum.n, color: resultNum.c, profit: -bet });
        }

        setHistory(h => [{ n: resultNum.n, c: resultNum.c, won }, ...h.slice(0, 4)]);
      }
    };

    animate();
  }, [spinning, bet, betType, state.balance, state.settings.fastMode, placeBet, addWin, drawRoulette, segAngle]);

  useEffect(() => {
    drawRoulette(wheelRotRef.current, ballAngleRef.current, false);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [drawRoulette]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-2">House Edge: {(HOUSE_EDGE * 100).toFixed(1)}%</div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} width={350} height={350} />
        </div>

        {/* Winning Number Display */}
        {winningNumber && (
          <div className="text-center mb-4">
            <div className={`inline-block px-6 py-3 rounded-xl text-3xl font-black ${
              winningNumber.c === 'green' ? 'bg-green-600' :
              winningNumber.c === 'red' ? 'bg-red-600' : 'bg-gray-900'
            } text-white`}>
              {winningNumber.n}
            </div>
          </div>
        )}

        {result && (
          <div className={`text-center py-3 rounded-lg mb-4 ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN! +$${result.profit.toFixed(2)}` : `Lost on ${result.number}`}
            </div>
          </div>
        )}

        {/* Bet Type Selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(BET_TYPES).slice(0, 4).map(([key, bt]) => (
            <button key={key}
              onClick={() => !spinning && setBetType(key)}
              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                betType === key
                  ? key === 'red' ? 'bg-red-600 text-white ring-2 ring-red-400' :
                    key === 'black' ? 'bg-gray-800 text-white ring-2 ring-gray-400' :
                    key === 'green' ? 'bg-green-600 text-white ring-2 ring-green-400' :
                    'bg-cyan-600 text-white ring-2 ring-cyan-400'
                  : key === 'red' ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' :
                    key === 'black' ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-800/50' :
                    key === 'green' ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' :
                    'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {bt.label}
              <div className="text-xs opacity-70">{bt.mult}x</div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(BET_TYPES).slice(4).map(([key, bt]) => (
            <button key={key}
              onClick={() => !spinning && setBetType(key)}
              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                betType === key
                  ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {bt.label}
              <div className="text-xs opacity-70">{bt.mult}x</div>
            </button>
          ))}
        </div>

        <button onClick={spin} disabled={spinning || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} disabled={spinning} />

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                  h.c === 'green' ? 'bg-green-600' : h.c === 'red' ? 'bg-red-600' : 'bg-gray-800'
                } ${h.won ? 'ring-2 ring-yellow-400' : ''}`}>
                  {h.n}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Current Bet</div>
          <div className="text-lg font-bold text-cyan-400">
            {BET_TYPES[betType].label} ({BET_TYPES[betType].mult}x)
          </div>
        </div>
      </div>
    </div>
  );
}
