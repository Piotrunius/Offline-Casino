import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const ROW_OPTIONS = {
  8: { low: [1.2, 1.1, 1, 0.6, 0.6, 1, 1.1, 1.2], medium: [2.5, 1.5, 1, 0.5, 0.5, 1, 1.5, 2.5], high: [7, 3, 1.5, 0.3, 0.3, 1.5, 3, 7] },
  12: { low: [1.5, 1.3, 1.1, 1, 0.6, 0.4, 0.4, 0.6, 1, 1.1, 1.3, 1.5], medium: [5, 2.5, 1.5, 1, 0.6, 0.3, 0.3, 0.6, 1, 1.5, 2.5, 5], high: [20, 8, 3, 1.5, 0.5, 0.2, 0.2, 0.5, 1.5, 3, 8, 20] },
  16: { low: [2, 1.5, 1.3, 1.1, 1, 0.7, 0.5, 0.4, 0.4, 0.5, 0.7, 1, 1.1, 1.3, 1.5, 2], medium: [15, 5, 2.5, 1.5, 1, 0.6, 0.4, 0.3, 0.3, 0.4, 0.6, 1, 1.5, 2.5, 5, 15], high: [100, 30, 10, 4, 2, 0.8, 0.4, 0.2, 0.2, 0.4, 0.8, 2, 4, 10, 30, 100] },
};

const HOUSE_EDGE = 0.02;

export default function PlinkoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [rows, setRows] = useState(12);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const multipliers = ROW_OPTIONS[rows][risk];

  const drawBoard = useCallback((ballX = null, ballY = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    const pegRadius = 5;
    const startY = 40;
    const endY = h - 60;
    const rowSpacing = (endY - startY) / rows;

    // Draw pegs
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = w * 0.8;
      const pegSpacing = rowWidth / (pegsInRow);
      const startX = (w - rowWidth) / 2 + pegSpacing / 2;

      for (let peg = 0; peg < pegsInRow; peg++) {
        const x = startX + peg * pegSpacing;
        const y = startY + row * rowSpacing;

        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#3a3a4e';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,245,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw buckets
    const bucketCount = multipliers.length;
    const bucketWidth = (w * 0.85) / bucketCount;
    const bucketStartX = w * 0.075;

    multipliers.forEach((mult, i) => {
      const x = bucketStartX + i * bucketWidth;
      let color = '#666';
      if (mult >= 10) color = '#ff3366';
      else if (mult >= 3) color = '#ff8800';
      else if (mult >= 1) color = '#00ff88';
      else if (mult >= 0.5) color = '#888';
      else color = '#444';

      ctx.fillStyle = `${color}40`;
      ctx.fillRect(x + 2, h - 50, bucketWidth - 4, 40);
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, h - 50, bucketWidth - 4, 40);

      ctx.fillStyle = color;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x + bucketWidth / 2, h - 25);
    });

    // Draw ball
    if (ballX !== null && ballY !== null) {
      ctx.beginPath();
      ctx.arc(ballX, ballY, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,245,255,0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ballX - 2, ballY - 2, 0, ballX, ballY, 8);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [rows, multipliers]);

  const drop = useCallback(() => {
    if (dropping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'plinko')) return;

    setDropping(true);
    setResult(null);
    audio.playBet();

    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const startY = 40;
    const endY = h - 60;
    const rowSpacing = (endY - startY) / rows;

    // Simulate path - each row ball goes left or right
    const path = [];
    for (let i = 0; i < rows; i++) {
      path.push(Math.random() > 0.5 ? 1 : -1);
    }

    // Calculate final bucket
    let position = 0;
    path.forEach(dir => position += dir);
    const bucketIdx = Math.floor((position + rows) / 2);
    const clampedBucket = Math.max(0, Math.min(multipliers.length - 1, bucketIdx));
    const mult = multipliers[clampedBucket];

    // Animate ball
    let ballX = w / 2;
    let ballY = 10;
    let currentRow = -1;
    let targetX = w / 2;
    let targetY = startY;
    let velocity = 0;

    const animate = () => {
      // Physics-like movement
      const dx = targetX - ballX;
      const dy = targetY - ballY;

      velocity += 0.5;
      ballY += Math.min(velocity, 8);
      ballX += dx * 0.15;

      // Check if reached current row
      if (ballY >= targetY && currentRow < rows - 1) {
        currentRow++;
        audio.playTick();

        const pegsInRow = currentRow + 3;
        const rowWidth = w * 0.8;
        const pegSpacing = rowWidth / pegsInRow;
        const startX = (w - rowWidth) / 2 + pegSpacing / 2;

        // Calculate position based on accumulated path
        let posSum = 0;
        for (let i = 0; i <= currentRow; i++) posSum += path[i];
        const pegIdx = Math.floor((pegsInRow - 1) / 2 + posSum / 2);
        const clampedPeg = Math.max(0, Math.min(pegsInRow - 1, pegIdx));

        targetX = startX + clampedPeg * pegSpacing + (path[currentRow] > 0 ? pegSpacing / 2 : -pegSpacing / 2);
        targetY = startY + (currentRow + 1) * rowSpacing;
        velocity = 0;
      }

      drawBoard(ballX, ballY);

      // Check if reached bottom
      if (ballY >= h - 55) {
        setDropping(false);

        if (mult > 0) {
          const win = bet * mult;
          addWin(win, bet, 'plinko', mult);
          mult >= 2 ? audio.playWin() : audio.playTick();
          setResult({ won: true, mult, profit: win - bet });
        } else {
          addWin(0, bet, 'plinko', 0);
          audio.playLose();
          setResult({ won: false, mult, profit: -bet });
        }

        setHistory(h => [{ mult, won: mult >= 1 }, ...h.slice(0, 19)]);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [dropping, bet, state.balance, rows, multipliers, placeBet, addWin, drawBoard]);

  useEffect(() => {
    drawBoard();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [drawBoard]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-500">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-400">{rows} rows</div>
        </div>

        <canvas ref={canvasRef} width={500} height={400} className="w-full rounded-xl mb-4" />

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
        <BetControls bet={bet} setBet={setBet} onPlay={drop} buttonText="DROP" hideButton />

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
