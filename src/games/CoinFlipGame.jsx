import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function CoinFlipGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const flip = useCallback(() => {
    if (flipping || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'coinflip')) return;

    setFlipping(true);
    setResult(null);
    audio.playBet();

    // Predetermined result
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = outcome === choice;

    // Calculate final rotation
    // Heads = 0 degrees (or multiples of 360), Tails = 180 degrees
    const spins = state.settings.fastMode ? 3 : 6;
    const targetRotation = rotation + (spins * 360) + (outcome === 'tails' ? 180 : 0);

    const duration = state.settings.fastMode ? 800 : 2000;
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      setRotation(currentRotation);

      if (progress < 1) {
        audio.playTick();
        animRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(targetRotation % 360);

        if (won) {
          const winAmount = bet * 2;
          addWin(winAmount, bet, 'coinflip', 2);
          audio.playWin();
          setResult({ won: true, outcome, profit: bet });
        } else {
          addWin(0, bet, 'coinflip', 0);
          audio.playLose();
          setResult({ won: false, outcome, profit: -bet });
        }

        setHistory(h => [{ won, outcome, choice }, ...h.slice(0, 19)]);
        setFlipping(false);
      }
    };

    animate();
  }, [bet, choice, rotation, state.balance, state.settings.fastMode, placeBet, addWin, flipping]);

  const coinFace = (rotation % 360) < 90 || (rotation % 360) >= 270 ? 'heads' : 'tails';

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Coin */}
        <div className="flex justify-center mb-8">
          <div
            className="relative w-48 h-48"
            style={{
              transform: `rotateY(${rotation}deg)`,
              transformStyle: 'preserve-3d',
              transition: flipping ? 'none' : 'transform 0.3s'
            }}
          >
            {/* Heads side */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <div className="text-6xl">👑</div>
                <div className="text-yellow-900 font-black text-xl">HEADS</div>
              </div>
            </div>

            {/* Tails side */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 flex items-center justify-center shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-center">
                <div className="text-6xl">🦅</div>
                <div className="text-yellow-900 font-black text-xl">TAILS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-6">
            <div className="text-3xl font-black text-gray-300 mb-2">
              {result.outcome.toUpperCase()}
            </div>
            <div className={`text-4xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN +$${result.profit.toFixed(2)}` : 'LOST'}
            </div>
          </div>
        )}

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setChoice('heads')}
            disabled={flipping}
            className={`py-6 rounded-xl font-bold text-xl transition-all border-2 ${
              choice === 'heads'
                ? 'bg-yellow-600 border-yellow-400 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">👑</div>
            HEADS
          </button>
          <button
            onClick={() => setChoice('tails')}
            disabled={flipping}
            className={`py-6 rounded-xl font-bold text-xl transition-all border-2 ${
              choice === 'tails'
                ? 'bg-yellow-600 border-yellow-400 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">🦅</div>
            TAILS
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Win Chance</div>
            <div className="text-2xl font-bold text-cyan-400">50%</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-xs uppercase">Payout</div>
            <div className="text-2xl font-bold text-green-400">2x</div>
          </div>
        </div>

        {/* Flip button */}
        <button
          onClick={flip}
          disabled={flipping || bet <= 0 || bet > state.balance}
          className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
            flipping
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400'
          } text-white`}
        >
          {flipping ? 'FLIPPING...' : `FLIP FOR $${bet.toFixed(2)}`}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={flip} buttonText="FLIP" hideButton />

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    h.won
                      ? 'bg-green-600'
                      : 'bg-red-600/50'
                  }`}
                  title={`${h.outcome} - ${h.won ? 'Won' : 'Lost'}`}
                >
                  {h.outcome === 'heads' ? '👑' : '🦅'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
