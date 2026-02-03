import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function CoinFlipGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]);

  const flip = useCallback(() => {
    if (flipping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'coinflip')) return;

    setFlipping(true);
    setResult(null);
    audio.playBet();

    const isHeads = Math.random() > 0.5;
    const won = (isHeads && choice === 'heads') || (!isHeads && choice === 'tails');
    const duration = state.settings.fastMode ? 800 : 1500;
    const totalRot = 1440 + (isHeads ? 0 : 180);
    const start = Date.now();
    const startRot = rotation;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setRotation(startRot + totalRot * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setFlipping(false);
        const outcome = isHeads ? 'heads' : 'tails';
        setHistory(h => [outcome, ...h.slice(0, 4)]);

        if (won) {
          const win = bet * 1.96;
          addWin(win, bet, 'coinflip', 1.96);
          setResult({ won: true, outcome, profit: win - bet });
          audio.playWin();
        } else {
          addWin(0, bet, 'coinflip', 0);
          setResult({ won: false, outcome, profit: -bet });
          audio.playLose();
        }
      }
    };
    animate();
  }, [flipping, bet, state.balance, choice, rotation, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const coinFace = Math.round(rotation / 180) % 2 === 0;

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col items-center justify-center">
        {/* Coin */}
        <div className="relative" style={{ perspective: '600px' }}>
          <div
            className="w-40 h-40 relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotation}deg)`,
              transition: flipping ? 'none' : 'transform 0.1s'
            }}
          >
            {/* Heads */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center text-5xl font-black bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              H
            </div>
            {/* Tails */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center text-5xl font-black bg-gradient-to-br from-gray-400 to-gray-600 border-4 border-gray-300 shadow-2xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              T
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 text-center py-3 px-8 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black capitalize ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.outcome}
            </div>
            <div className={`text-lg ${result.won ? 'text-green-300' : 'text-red-300'}`}>
              {result.won ? '+' : ''}{result.profit.toFixed(2)}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4 flex gap-2">
            {history.map((h, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${h === 'heads' ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                {h[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Choice */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Pick Side</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => !flipping && setChoice('heads')}
                disabled={flipping}
                className={`py-4 rounded-xl font-black text-lg transition-all ${
                  choice === 'heads'
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-black ring-2 ring-yellow-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                HEADS
              </button>
              <button
                onClick={() => !flipping && setChoice('tails')}
                disabled={flipping}
                className={`py-4 rounded-xl font-black text-lg transition-all ${
                  choice === 'tails'
                    ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-white ring-2 ring-gray-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                TAILS
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
                disabled={flipping}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={flipping} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={flipping} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={flipping} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={flipping} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Win Info */}
          <div className="bg-black/30 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-cyan-400 font-bold">1.96x</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Win Amount</span>
              <span className="text-green-400 font-bold">${(bet * 1.96).toFixed(2)}</span>
            </div>
          </div>

          {/* Flip Button */}
          <button
            onClick={flip}
            disabled={flipping || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {flipping ? 'FLIPPING...' : 'FLIP COIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
