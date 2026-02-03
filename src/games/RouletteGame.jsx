import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

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
  const [bet, setBet] = useState(10);
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

    // Outer frame
    ctx.beginPath();
    ctx.arc(cx, cy, r + 25, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Wheel
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((wheelRot * Math.PI) / 180);

    NUMBERS.forEach((num, i) => {
      const start = (i * segAngle) * Math.PI / 180;
      const end = ((i + 1) * segAngle) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();

      ctx.fillStyle = num.c === 'green' ? '#00aa55' : num.c === 'red' ? '#cc0000' : '#111';
      ctx.fill();
      ctx.strokeStyle = '#c9a73f';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + (segAngle / 2) * Math.PI / 180);
      ctx.translate(r * 0.8, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(num.n.toString(), 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#c9a73f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball track
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 167, 63, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball
    if (showBall) {
      const ballDist = r * 0.72;
      const ballRad = ballAngle * Math.PI / 180;
      const ballX = cx + Math.cos(ballRad) * ballDist;
      const ballY = cy + Math.sin(ballRad) * ballDist;

      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
  }, [segAngle]);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'roulette')) return;

    setSpinning(true);
    setResult(null);
    setWinningNumber(null);
    audio.playBet();

    // Pick result
    const resultIdx = Math.floor(Math.random() * NUMBERS.length);
    const resultNum = NUMBERS[resultIdx];

    // Animation
    const wheelSpins = 2 + Math.random();
    const ballSpins = 6 + Math.random() * 2;

    // Final positions
    // Ball needs to stop at segment resultIdx
    // Ball angle = wheel angle + segment position
    const segmentAngle = resultIdx * segAngle + segAngle / 2;
    const finalWheelRot = wheelRotRef.current + wheelSpins * 360;
    // Ball goes opposite direction and lands on segment
    const finalBallAngle = finalWheelRot + segmentAngle - 90;

    const startWheelRot = wheelRotRef.current;
    const startBallAngle = ballAngleRef.current;
    const duration = state.settings.fastMode ? 3500 : 6000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      const wheelEase = 1 - Math.pow(1 - progress, 3);
      const ballEase = 1 - Math.pow(1 - progress, 4);

      const currentWheelRot = startWheelRot + (finalWheelRot - startWheelRot) * wheelEase;
      // Ball spins faster and in opposite direction initially
      const totalBallRotation = ballSpins * 360 + (finalBallAngle - startBallAngle);
      const currentBallAngle = startBallAngle + totalBallRotation * ballEase;

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

        setHistory(h => [{ n: resultNum.n, c: resultNum.c }, ...h.slice(0, 19)]);
      }
    };

    animate();
  }, [spinning, bet, state.balance, state.settings.fastMode, betType, placeBet, addWin, drawRoulette, segAngle]);

  useEffect(() => {
    drawRoulette(0, -90, false);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-2">House Edge: {(HOUSE_EDGE * 100).toFixed(1)}%</div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} width={320} height={320} />
        </div>

        {winningNumber && (
          <div className="text-center mb-4">
            <span className={`inline-block px-6 py-3 rounded-xl text-3xl font-black ${
              winningNumber.c === 'green' ? 'bg-green-600' : winningNumber.c === 'red' ? 'bg-red-600' : 'bg-gray-800'
            }`}>
              {winningNumber.n}
            </span>
          </div>
        )}

        {result && (
          <div className={`text-center text-2xl font-bold mb-4 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
            {result.won ? `+$${result.profit.toFixed(2)}` : 'No Win'}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(BET_TYPES).map(([key, bt]) => (
            <button key={key} onClick={() => !spinning && setBetType(key)}
              className={`py-2 rounded-lg font-bold text-sm ${
                betType === key
                  ? key === 'red' ? 'bg-red-600 text-white'
                  : key === 'black' ? 'bg-gray-800 text-white border border-gray-500'
                  : key === 'green' ? 'bg-green-600 text-white'
                  : 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {bt.label} ({bt.mult}x)
            </button>
          ))}
        </div>

        <button onClick={spin} disabled={spinning || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={spin} buttonText="SPIN" hideButton />

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  h.c === 'green' ? 'bg-green-600' : h.c === 'red' ? 'bg-red-600' : 'bg-gray-700'
                }`}>
                  {h.n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
