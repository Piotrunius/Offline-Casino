import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// Multipliers for different risk levels and row counts
const MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.1, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.1, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

const HOUSE_EDGE = 0.01;

export default function PlinkoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(() => Math.floor(state.balance * 0.05) || 10);
  const [risk, setRisk] = useState('medium');
  const [rows, setRows] = useState(12);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const multipliers = MULTIPLIERS[rows][risk];
  const bucketCount = rows + 1;

  const drawBoard = useCallback((ballX = null, ballY = null, hitPegs = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    const pegRadius = 4;
    const startY = 50;
    const endY = h - 70;
    const rowSpacing = (endY - startY) / rows;

    // Draw pegs
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = w * 0.85;
      const pegSpacing = rowWidth / pegsInRow;
      const startX = (w - rowWidth) / 2 + pegSpacing / 2;

      for (let peg = 0; peg < pegsInRow; peg++) {
        const x = startX + peg * pegSpacing;
        const y = startY + row * rowSpacing;
        const isHit = hitPegs.some(p => p.row === row && p.peg === peg);

        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = isHit ? '#00f5ff' : '#3a3a4e';
        ctx.fill();

        if (isHit) {
          ctx.shadowColor = '#00f5ff';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw buckets
    const bucketWidth = (w * 0.9) / bucketCount;
    const bucketStartX = w * 0.05;

    multipliers.forEach((mult, i) => {
      const x = bucketStartX + i * bucketWidth;
      let color = '#666';
      if (mult >= 100) color = '#ff0066';
      else if (mult >= 10) color = '#ff3366';
      else if (mult >= 3) color = '#ff8800';
      else if (mult >= 1) color = '#00ff88';
      else if (mult >= 0.5) color = '#888';
      else color = '#444';

      // Bucket background
      ctx.fillStyle = `${color}30`;
      ctx.fillRect(x + 2, h - 60, bucketWidth - 4, 50);

      // Bucket border
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, h - 60, bucketWidth - 4, 50);

      // Multiplier text
      ctx.fillStyle = color;
      ctx.font = `bold ${bucketWidth > 30 ? '11px' : '9px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x + bucketWidth / 2, h - 30);
    });

    // Draw ball
    if (ballX !== null && ballY !== null) {
      // Glow
      ctx.beginPath();
      ctx.arc(ballX, ballY, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,245,255,0.3)';
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ballX - 3, ballY - 3, 0, ballX, ballY, 10);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(0.5, '#0088ff');
      grad.addColorStop(1, '#0044aa');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [rows, multipliers, bucketCount]);

  const drop = useCallback(() => {
    if (dropping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'plinko')) return;

    setDropping(true);
    setResult(null);
    audio.playBet();

    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const startY = 50;
    const endY = h - 70;
    const rowSpacing = (endY - startY) / rows;

    // Pre-calculate the path (which direction at each peg)
    const path = [];
    for (let i = 0; i < rows; i++) {
      path.push(Math.random() > 0.5 ? 1 : -1);
    }

    // Calculate final bucket from path
    let position = 0;
    path.forEach(dir => position += dir);
    // Map position to bucket index
    // position ranges from -rows to +rows, we need 0 to bucketCount-1
    const bucketIdx = Math.round((position + rows) / 2);
    const clampedBucket = Math.max(0, Math.min(bucketCount - 1, bucketIdx));
    const mult = multipliers[clampedBucket];

    // Animation state
    let ballX = w / 2;
    let ballY = 20;
    let currentRow = -1;
    let hitPegs = [];
    let velocityY = 0;
    let velocityX = 0;

    const animate = () => {
      // Calculate target for current row
      const targetRow = Math.min(Math.floor((ballY - startY + rowSpacing / 2) / rowSpacing), rows - 1);

      if (targetRow > currentRow && currentRow < rows - 1) {
        currentRow = targetRow;
        audio.playTick();

        // Calculate peg position
        const pegsInRow = currentRow + 3;
        const rowWidth = w * 0.85;
        const pegSpacing = rowWidth / pegsInRow;
        const startX = (w - rowWidth) / 2 + pegSpacing / 2;

        // Determine which peg we're hitting based on accumulated path
        let posSum = 0;
        for (let i = 0; i <= currentRow; i++) posSum += path[i];

        // Calculate peg index from position
        const centerPeg = (pegsInRow - 1) / 2;
        const pegIdx = Math.round(centerPeg + posSum / 2);
        const clampedPeg = Math.max(0, Math.min(pegsInRow - 1, pegIdx));

        hitPegs.push({ row: currentRow, peg: clampedPeg });

        // Set new target X based on direction
        const targetX = startX + clampedPeg * pegSpacing + (path[currentRow] > 0 ? pegSpacing / 2 : -pegSpacing / 2);
        velocityX = (targetX - ballX) * 0.3;
      }

      // Physics
      velocityY += 0.8;
      velocityY *= 0.95;
      velocityX *= 0.92;

      ballY += velocityY;
      ballX += velocityX;

      // Keep ball in bounds
      ballX = Math.max(30, Math.min(w - 30, ballX));

      drawBoard(ballX, ballY, hitPegs);

      // Check if reached bottom
      if (ballY >= h - 45) {
        setDropping(false);

        // Center ball in bucket
        const bucketWidth = (w * 0.9) / bucketCount;
        const bucketStartX = w * 0.05;
        const finalX = bucketStartX + clampedBucket * bucketWidth + bucketWidth / 2;
        drawBoard(finalX, h - 45, hitPegs);

        if (mult >= 1) {
          const win = bet * mult;
          addWin(win, bet, 'plinko', mult);
          mult >= 3 ? audio.playWin() : audio.playTick();
          setResult({ won: true, mult, profit: win - bet, bucket: clampedBucket });
        } else {
          const win = bet * mult;
          addWin(win, bet, 'plinko', mult);
          audio.playLose();
          setResult({ won: false, mult, profit: win - bet, bucket: clampedBucket });
        }

        setHistory(h => [{ mult, won: mult >= 1 }, ...h.slice(0, 4)]);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [dropping, bet, state.balance, rows, multipliers, bucketCount, placeBet, addWin, drawBoard]);

  useEffect(() => {
    drawBoard();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [drawBoard]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-500">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-400">{rows} rows | {risk}</div>
        </div>

        <canvas ref={canvasRef} width={500} height={450} className="w-full rounded-xl mb-4" />

        {result && (
          <div className={`text-center text-2xl font-bold mb-4 ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {result.mult}x — {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}
          </div>
        )}

        <button onClick={drop} disabled={dropping || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-xl disabled:opacity-50">
          {dropping ? 'DROPPING...' : 'DROP'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} disabled={dropping} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Rows</div>
          <div className="grid grid-cols-3 gap-2">
            {[8, 12, 16].map(r => (
              <button key={r} onClick={() => !dropping && setRows(r)}
                className={`py-2 rounded-lg font-bold ${rows === r ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Risk</div>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map(r => (
              <button key={r} onClick={() => !dropping && setRisk(r)}
                className={`py-2 rounded-lg font-bold text-sm capitalize ${risk === r ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult}x
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
