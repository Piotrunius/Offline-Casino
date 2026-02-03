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
  green: { label: 'GREEN (0)', mult: 36, check: n => n === 0 },
  odd: { label: 'ODD', mult: 2, check: n => n > 0 && n % 2 === 1 },
  even: { label: 'EVEN', mult: 2, check: n => n > 0 && n % 2 === 0 },
  low: { label: '1-18', mult: 2, check: n => n >= 1 && n <= 18 },
  high: { label: '19-36', mult: 2, check: n => n >= 19 && n <= 36 }
};

export default function RouletteGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('red');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentNum, setCurrentNum] = useState(NUMBERS[0]);
  const canvasRef = useRef(null);
  const wheelRotRef = useRef(0);
  const ballRotRef = useRef(0);
  const animRef = useRef(null);

  const segAngle = 360 / NUMBERS.length;

  const drawRoulette = useCallback((wheelRot, ballRot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 40;

    ctx.clearRect(0, 0, size, size);

    // Outer wood frame
    ctx.beginPath();
    ctx.arc(cx, cy, r + 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw wheel
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((wheelRot * Math.PI) / 180);

    NUMBERS.forEach((num, i) => {
      const start = (i * segAngle - 90) * Math.PI / 180;
      const end = ((i + 1) * segAngle - 90) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();

      // Color
      ctx.fillStyle = num.c === 'green' ? '#00aa55' : num.c === 'red' ? '#cc0000' : '#111';
      ctx.fill();
      ctx.strokeStyle = '#c9a73f';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number
      ctx.save();
      ctx.rotate(start + (segAngle / 2) * Math.PI / 180);
      ctx.translate(r * 0.78, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(num.n.toString(), 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#c9a73f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball track
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 167, 63, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball
    const ballDist = r * 0.7;
    const ballAngle = (ballRot - 90) * Math.PI / 180;
    const ballX = cx + Math.cos(ballAngle) * ballDist;
    const ballY = cy + Math.sin(ballAngle) * ballDist;

    // Ball glow
    ctx.beginPath();
    ctx.arc(ballX, ballY, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    const ballGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 0, ballX, ballY, 8);
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(1, '#aaa');
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.strokeStyle = '#c9a73f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [segAngle]);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'roulette')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Pick result
    const resultIdx = Math.floor(Math.random() * NUMBERS.length);
    const resultNum = NUMBERS[resultIdx];

    // Animation parameters
    const wheelSpins = 2 + Math.random();
    const ballSpins = 5 + Math.random() * 2;

    // Calculate final positions
    // Ball needs to end up over the result segment
    const targetSegAngle = resultIdx * segAngle + segAngle / 2;
    const finalWheelRot = wheelRotRef.current + wheelSpins * 360;
    const finalBallRot = finalWheelRot + targetSegAngle;

    const startWheelRot = wheelRotRef.current;
    const startBallRot = ballRotRef.current;
    const totalWheelRot = finalWheelRot - startWheelRot;
    const totalBallRot = ballSpins * 360 + (finalBallRot - startBallRot);

    const duration = state.settings.fastMode ? 4000 : 7000;
    const startTime = Date.now();
    let lastTick = -1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Easing
      const wheelEase = 1 - Math.pow(1 - progress, 3);
      const ballEase = 1 - Math.pow(1 - progress, 4);

      const currentWheelRot = startWheelRot + totalWheelRot * wheelEase;
      const currentBallRot = startBallRot + totalBallRot * ballEase;

      wheelRotRef.current = currentWheelRot;
      ballRotRef.current = currentBallRot;

      drawRoulette(currentWheelRot, currentBallRot);

      // Calculate current segment under ball
      const relAngle = ((currentBallRot - currentWheelRot) % 360 + 360) % 360;
      const segIdx = Math.floor(relAngle / segAngle) % NUMBERS.length;
      setCurrentNum(NUMBERS[segIdx]);

      // Tick sound
      if (segIdx !== lastTick && progress < 0.85) {
        audio.playTick();
        lastTick = segIdx;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Done
        setSpinning(false);
        setCurrentNum(resultNum);

        const betInfo = BET_TYPES[betType];
        const won = betInfo.check(resultNum.n);

        if (won) {
          const winAmount = bet * betInfo.mult;
          addWin(winAmount, bet, 'roulette', betInfo.mult);
          audio.playWin();
          setResult({ won: true, num: resultNum, profit: winAmount - bet });
        } else {
          addWin(0, bet, 'roulette', 0);
          audio.playLose();
          setResult({ won: false, num: resultNum, profit: -bet });
        }

        setHistory(h => [resultNum, ...h.slice(0, 19)]);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, bet, betType, state.balance, state.settings.fastMode, segAngle, placeBet, addWin, drawRoulette]);

  useEffect(() => {
    drawRoulette(0, 0);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawRoulette]);

  const getColorClass = c => c === 'red' ? 'bg-red-600' : c === 'green' ? 'bg-green-600' : 'bg-gray-900';

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Current number */}
        <div className="text-center mb-4">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl ${getColorClass(currentNum.c)}`}>
            <span className="text-3xl font-black text-white">{currentNum.n}</span>
            <span className="text-white/70 uppercase">{currentNum.c}</span>
          </div>
        </div>

        <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-md mx-auto" />

        {result && (
          <div className="text-center mt-4">
            <div className={`text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 justify-center">
            {history.slice(0, 12).map((h, i) => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${getColorClass(h.c)}`}>
                {h.n}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={spin} disabled={spinning}
          buttonText={spinning ? 'SPINNING...' : 'SPIN'} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Bet Type</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(BET_TYPES).map(([key, info]) => (
              <button key={key} onClick={() => !spinning && setBetType(key)}
                className={`p-3 rounded-lg text-sm font-bold transition-all ${
                  betType === key
                    ? key === 'red' ? 'bg-red-600 text-white'
                    : key === 'black' ? 'bg-gray-900 text-white border border-gray-600'
                    : key === 'green' ? 'bg-green-600 text-white'
                    : 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}>
                <div>{info.label}</div>
                <div className="text-xs opacity-70">{info.mult}x</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
