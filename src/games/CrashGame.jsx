import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function CrashGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [cashoutAt, setCashoutAt] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [currentMult, setCurrentMult] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);
  const crashPointRef = useRef(1);

  const play = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'crash')) return;

    setPlaying(true);
    setCrashed(false);
    setResult(null);
    setCurrentMult(1);
    audio.playBet();

    // Generate crash point (house edge ~4%)
    const rand = Math.random();
    const crashPoint = Math.max(1, 0.99 / (1 - rand));
    crashPointRef.current = crashPoint;

    const startTime = Date.now();
    const speed = state.settings.fastMode ? 300 : 150;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const mult = 1 + elapsed / 1000 * (speed / 100);

      if (mult >= crashPoint) {
        // CRASHED
        setCrashed(true);
        setPlaying(false);
        setCurrentMult(crashPoint);
        setResult({ crashed: true, mult: crashPoint, won: false, profit: -bet });
        setHistory(h => [{ mult: crashPoint, won: false }, ...h.slice(0, 4)]);
        addWin(0, bet, 'crash', 0);
        audio.playLose();
      } else if (mult >= cashoutAt) {
        // AUTO CASHOUT
        setPlaying(false);
        setCurrentMult(mult);
        const winAmount = bet * cashoutAt;
        setResult({ crashed: false, mult: cashoutAt, won: true, profit: winAmount - bet });
        setHistory(h => [{ mult: cashoutAt, won: true }, ...h.slice(0, 4)]);
        addWin(winAmount, bet, 'crash', cashoutAt);
        audio.playWin();
      } else {
        setCurrentMult(mult);
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [playing, bet, state.balance, cashoutAt, state.settings.fastMode, placeBet, addWin]);

  const cashout = useCallback(() => {
    if (!playing || crashed) return;
    cancelAnimationFrame(animRef.current);

    setPlaying(false);
    const winAmount = bet * currentMult;
    setResult({ crashed: false, mult: currentMult, won: true, profit: winAmount - bet });
    setHistory(h => [{ mult: currentMult, won: true }, ...h.slice(0, 4)]);
    addWin(winAmount, bet, 'crash', currentMult);
    audio.playWin();
  }, [playing, crashed, currentMult, bet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col items-center justify-center">
        {/* Multiplier Display */}
        <div className={`text-7xl font-black mb-4 ${crashed ? 'text-red-500' : currentMult >= 2 ? 'text-green-400' : 'text-white'}`}>
          {currentMult.toFixed(2)}x
        </div>

        {/* Graph Visualization */}
        <div className="w-full max-w-md h-32 bg-black/50 rounded-lg relative overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={crashed ? '#ff0000' : '#00ff88'} stopOpacity="0.5" />
                <stop offset="100%" stopColor={crashed ? '#ff0000' : '#00ff88'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 50 Q ${Math.min(currentMult * 10, 100)} ${50 - Math.min(currentMult * 10, 45)} ${Math.min(currentMult * 20, 100)} ${50 - Math.min(currentMult * 15, 48)}`}
              fill="url(#crashGrad)"
              stroke={crashed ? '#ff0000' : '#00ff88'}
              strokeWidth="2"
            />
          </svg>
          {crashed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-red-500 font-black text-3xl animate-pulse">CRASHED!</span>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `CASHED OUT ${result.mult.toFixed(2)}x → +$${result.profit.toFixed(2)}` : `CRASHED @ ${result.mult.toFixed(2)}x`}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Auto Cashout */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Auto Cashout: {cashoutAt.toFixed(2)}x</label>
            <input
              type="range"
              min={1.1}
              max={10}
              step={0.1}
              value={cashoutAt}
              onChange={(e) => !playing && setCashoutAt(Number(e.target.value))}
              disabled={playing}
              className="w-full mt-1 accent-cyan-500"
            />
            <div className="grid grid-cols-4 gap-1 mt-1">
              {[1.5, 2, 3, 5].map(v => (
                <button key={v} onClick={() => !playing && setCashoutAt(v)} disabled={playing}
                  className={`py-1 rounded text-xs font-bold ${cashoutAt === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {v}x
                </button>
              ))}
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
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Profit at {cashoutAt}x</span>
              <span className="text-green-400 font-bold">${(bet * cashoutAt - bet).toFixed(2)}</span>
            </div>
          </div>

          {/* Play/Cashout Button */}
          {playing ? (
            <button
              onClick={cashout}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-lg animate-pulse"
            >
              CASHOUT ${(bet * currentMult).toFixed(2)}
            </button>
          ) : (
            <button
              onClick={play}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1 mt-auto">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult.toFixed(2)}x
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
