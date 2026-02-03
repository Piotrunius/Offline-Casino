import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const ROWS = 12;
const MULTIPLIERS = {
  low:    [1.4, 1.2, 1.1, 1, 0.6, 0.4, 0.6, 1, 1.1, 1.2, 1.4],
  medium: [3, 2, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 2, 3],
  high:   [10, 5, 2, 1, 0.3, 0.2, 0.3, 1, 2, 5, 10]
};

export default function PlinkoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const ballRef = useRef(null);

  const multipliers = MULTIPLIERS[risk];
  const bucketCount = multipliers.length;

  const drawBoard = useCallback((ballX = null, ballY = null, trail = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pegGapY = (h - 120) / ROWS;
    const pegGapX = (w - 80) / (ROWS + 2);

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Draw pegs
    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegGapX;
      const startX = (w - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * pegGapX;
        const y = 50 + row * pegGapY;

        // Check if ball is near
        const nearBall = ballX !== null && Math.hypot(ballX - x, ballY - y) < 25;

        // Peg glow
        if (nearBall) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fillStyle = risk === 'high' ? 'rgba(255,51,102,0.3)' :
                          risk === 'medium' ? 'rgba(255,238,0,0.3)' : 'rgba(0,255,136,0.3)';
          ctx.fill();
        }

        // Peg
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 6);
        grad.addColorStop(0, '#4a4a5e');
        grad.addColorStop(1, '#2a2a3e');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = nearBall ? '#00f5ff' : 'rgba(0,245,255,0.2)';
        ctx.lineWidth = nearBall ? 2 : 1;
        ctx.stroke();
      }
    }

    // Draw buckets
    const bucketW = w / bucketCount;
    const bucketY = h - 50;

    multipliers.forEach((mult, i) => {
      const x = i * bucketW + bucketW / 2;
      const isCenter = i === Math.floor(bucketCount / 2);
      const isEdge = i === 0 || i === bucketCount - 1;

      // Bucket color based on multiplier
      let color;
      if (mult >= 5) color = '#ff3366';
      else if (mult >= 2) color = '#ff8800';
      else if (mult >= 1) color = '#00ff88';
      else color = '#666666';

      // Bucket background
      ctx.fillStyle = `${color}30`;
      ctx.fillRect(i * bucketW + 2, bucketY - 30, bucketW - 4, 50);

      // Border
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      ctx.strokeRect(i * bucketW + 2, bucketY - 30, bucketW - 4, 50);

      // Multiplier text
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x, bucketY);
    });

    // Draw trail
    trail.forEach((pos, i) => {
      const alpha = (i / trail.length) * 0.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8 - (trail.length - i) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
      ctx.fill();
    });

    // Draw ball
    if (ballX !== null && ballY !== null) {
      // Glow
      ctx.beginPath();
      ctx.arc(ballX, ballY, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.3)';
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(ballX - 3, ballY - 3, 0, ballX, ballY, 10);
      ballGrad.addColorStop(0, '#00ffff');
      ballGrad.addColorStop(1, '#0088ff');
      ctx.fillStyle = ballGrad;
      ctx.fill();
    }
  }, [risk, multipliers, bucketCount]);

  const drop = useCallback(() => {
    if (dropping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'plinko')) return;

    setDropping(true);
    setResult(null);
    audio.playBet();

    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const pegGapY = (h - 120) / ROWS;
    const pegGapX = (w - 80) / (ROWS + 2);

    // Simulate ball path (determine outcome first)
    let position = 0; // Center position, will go left (-) or right (+)
    const path = [];

    for (let row = 0; row < ROWS; row++) {
      const goRight = Math.random() > 0.5;
      position += goRight ? 1 : -1;
      path.push(goRight);
    }

    // Map position to bucket
    const finalBucket = Math.floor((position + ROWS) / 2);
    const clampedBucket = Math.max(0, Math.min(bucketCount - 1, finalBucket));
    const mult = multipliers[clampedBucket];

    // Animate the ball
    let currentRow = -1;
    let ballX = w / 2;
    let ballY = 20;
    let targetX = w / 2;
    let targetY = 50;
    let frame = 0;
    const trail = [];
    const framesPerRow = state.settings.fastMode ? 20 : 40;

    const animate = () => {
      frame++;

      // Update target when reaching current target
      if (frame % framesPerRow === 0 && currentRow < ROWS - 1) {
        currentRow++;
        const pegsInRow = currentRow + 3;
        const rowWidth = (pegsInRow - 1) * pegGapX;
        const startX = (w - rowWidth) / 2;

        // Calculate ball position based on path
        let posInRow = Math.floor(pegsInRow / 2);
        for (let i = 0; i <= currentRow; i++) {
          posInRow += path[i] ? 1 : -1;
        }
        posInRow = Math.max(0, Math.min(pegsInRow - 1, Math.floor((posInRow + pegsInRow) / 2)));

        targetX = startX + posInRow * pegGapX;
        targetY = 50 + currentRow * pegGapY;

        audio.playTick();
      }

      // Smooth movement
      ballX += (targetX - ballX) * 0.15;
      ballY += (targetY - ballY) * 0.15;

      // Add to trail
      trail.push({ x: ballX, y: ballY });
      if (trail.length > 15) trail.shift();

      // Draw
      drawBoard(ballX, ballY, trail);

      // Check if animation complete
      if (currentRow >= ROWS - 1 && Math.abs(ballX - targetX) < 1 && Math.abs(ballY - targetY) < 1) {
        // Move to bucket
        const bucketX = (clampedBucket + 0.5) * (w / bucketCount);
        const bucketY = h - 40;

        const finishAnimation = () => {
          ballX += (bucketX - ballX) * 0.1;
          ballY += (bucketY - ballY) * 0.1;
          trail.push({ x: ballX, y: ballY });
          if (trail.length > 15) trail.shift();
          drawBoard(ballX, ballY, trail);

          if (Math.abs(ballX - bucketX) < 2 && Math.abs(ballY - bucketY) < 2) {
            // Done!
            const winAmount = bet * mult;
            addWin(winAmount, bet, 'plinko', mult);

            if (mult >= 1) {
              audio.playWin();
            } else {
              audio.playLose();
            }

            setResult({ multiplier: mult, profit: winAmount - bet });
            setHistory(h => [{ mult, won: mult >= 1 }, ...h.slice(0, 19)]);
            setDropping(false);

            // Clear ball after a moment
            setTimeout(() => drawBoard(null, null, []), 1000);
            return;
          }

          requestAnimationFrame(finishAnimation);
        };

        finishAnimation();
        return;
      }

      ballRef.current = requestAnimationFrame(animate);
    };

    ballRef.current = requestAnimationFrame(animate);
  }, [dropping, bet, state.balance, state.settings.fastMode, bucketCount, multipliers, placeBet, addWin, drawBoard]);

  useEffect(() => {
    drawBoard(null, null, []);
    return () => cancelAnimationFrame(ballRef.current);
  }, [drawBoard]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <canvas ref={canvasRef} width={500} height={450} className="w-full rounded-xl" />

        {result && (
          <div className={`text-center mt-4 text-3xl font-black ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {result.multiplier}x • {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}
          </div>
        )}

        {history.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 justify-center">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className={`px-3 py-1 rounded-lg text-sm font-bold ${
                h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {h.mult}x
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={drop} disabled={dropping}
          buttonText={dropping ? 'DROPPING...' : 'DROP BALL'} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Risk Level</div>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map(r => (
              <button key={r} onClick={() => !dropping && setRisk(r)}
                className={`py-3 rounded-lg font-bold transition-all capitalize ${
                  risk === r
                    ? r === 'low' ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                    : r === 'medium' ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                    : 'bg-red-500/30 text-red-400 border border-red-500/50'
                    : 'bg-gray-800/50 text-gray-400'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
