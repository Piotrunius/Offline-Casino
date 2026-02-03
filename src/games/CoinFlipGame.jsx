import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const HOUSE_EDGE = 0.02;

export default function CoinFlipGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [coinRotation, setCoinRotation] = useState(0);
  const [history, setHistory] = useState([]);

  const flip = useCallback(() => {
    if (flipping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'coinflip')) return;

    setFlipping(true);
    setResult(null);
    audio.playBet();

    // Determine result
    const isHeads = Math.random() > 0.5;
    const won = (isHeads && choice === 'heads') || (!isHeads && choice === 'tails');

    // Animation
    const duration = state.settings.fastMode ? 1000 : 2000;
    const totalRotation = 1800 + (isHeads ? 0 : 180);
    const startTime = Date.now();
    const startRotation = coinRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCoinRotation(startRotation + totalRotation * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setFlipping(false);
        const outcome = isHeads ? 'heads' : 'tails';
        setHistory(h => [outcome, ...h.slice(0, 19)]);

        if (won) {
          const win = bet * 2;
          addWin(win, bet, 'coinflip', 2);
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
  }, [flipping, bet, state.balance, state.settings.fastMode, choice, coinRotation, placeBet, addWin]);

  const coinFace = Math.round(coinRotation / 180) % 2 === 0;

  return (
    <div className="max-w-md mx-auto">
      <div className="game-card p-6">
        <div className="text-xs text-gray-500 mb-4">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Coin */}
        <div className="flex justify-center mb-6" style={{ perspective: '500px' }}>
          <div
            className="w-32 h-32 rounded-full relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${coinRotation}deg)`,
              transition: flipping ? 'none' : 'transform 0.1s'
            }}>
            {/* Heads */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-4xl font-black
              bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-lg`}
              style={{ backfaceVisibility: 'hidden' }}>
              H
            </div>
            {/* Tails */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-4xl font-black
              bg-gradient-to-br from-gray-300 to-gray-500 border-4 border-gray-200 shadow-lg`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              T
            </div>
          </div>
        </div>

        {/* Choice */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => !flipping && setChoice('heads')}
            disabled={flipping}
            className={`py-4 rounded-xl font-black text-xl transition ${
              choice === 'heads'
                ? 'bg-yellow-500 text-black ring-2 ring-yellow-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}>
            HEADS
          </button>
          <button onClick={() => !flipping && setChoice('tails')}
            disabled={flipping}
            className={`py-4 rounded-xl font-black text-xl transition ${
              choice === 'tails'
                ? 'bg-gray-400 text-black ring-2 ring-gray-200'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}>
            TAILS
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black uppercase ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.outcome} - {result.won ? 'WIN!' : 'LOSE'}
            </div>
            <div className="text-lg">
              {result.profit >= 0 ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {/* Flip Button */}
        <button onClick={flip}
          disabled={flipping || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-black text-xl disabled:opacity-50 mb-4">
          {flipping ? 'FLIPPING...' : 'FLIP'}
        </button>

        <BetControls bet={bet} setBet={setBet} onPlay={flip} buttonText="FLIP" hideButton />

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 uppercase mb-2">History</div>
            <div className="flex flex-wrap gap-1">
              {history.map((h, i) => (
                <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  h === 'heads' ? 'bg-yellow-500 text-black' : 'bg-gray-400 text-black'
                }`}>
                  {h[0].toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
