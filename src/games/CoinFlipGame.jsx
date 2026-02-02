import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

export default function CoinFlipGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]);

  const flip = useCallback(() => {
    if (bet <= 0 || bet > state.balance || flipping) return;
    if (!placeBet(bet, 'coinflip')) return;

    setFlipping(true);
    setResult(null);

    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = outcome === choice;

    // Animate coin
    let spins = 0;
    const totalSpins = 20;
    const animate = () => {
      spins++;
      setRotation(spins * 180);

      if (spins < totalSpins) {
        setTimeout(animate, 50 + spins * 3);
      } else {
        // Final position
        setRotation(outcome === 'heads' ? 0 : 180);

        if (won) {
          const winAmount = bet * 1.98;
          addWin(winAmount, bet, 'coinflip', 1.98);
          setResult({ won: true, outcome, profit: (winAmount - bet).toFixed(2) });
        } else {
          addWin(0, bet, 'coinflip', 0);
          setResult({ won: false, outcome, profit: (-bet).toFixed(2) });
        }

        setHistory(h => [{ outcome, won }, ...h.slice(0, 9)]);
        setFlipping(false);
      }
    };

    setTimeout(animate, 100);
  }, [bet, choice, state.balance, flipping, placeBet, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Display */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        {/* Coin */}
        <div className="flex justify-center mb-8">
          <div
            className="w-48 h-48 rounded-full relative"
            style={{
              transform: `rotateX(${rotation}deg)`,
              transformStyle: 'preserve-3d',
              transition: flipping ? 'none' : 'transform 0.3s'
            }}
          >
            {/* Heads */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-6xl font-black ${
              result?.outcome === 'heads' && result.won ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-yellow-500 to-yellow-700'
            }`} style={{ backfaceVisibility: 'hidden' }}>
              👑
            </div>
            {/* Tails */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-6xl font-black ${
              result?.outcome === 'tails' && result.won ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 'bg-gradient-to-br from-gray-500 to-gray-700'
            }`} style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
              🦅
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-8">
            <div className={`text-4xl font-black mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? 'WIN!' : 'LOSE!'}
            </div>
            <div className={`text-2xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* Choice Buttons */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={() => !flipping && setChoice('heads')}
            disabled={flipping}
            className={`py-6 rounded-xl font-bold text-xl transition ${
              choice === 'heads'
                ? 'bg-yellow-500 text-black'
                : 'bg-[#12121f] text-gray-400 hover:text-white border border-[#2a2a45]'
            }`}
          >
            👑 HEADS
          </button>
          <button
            onClick={() => !flipping && setChoice('tails')}
            disabled={flipping}
            className={`py-6 rounded-xl font-bold text-xl transition ${
              choice === 'tails'
                ? 'bg-gray-500 text-white'
                : 'bg-[#12121f] text-gray-400 hover:text-white border border-[#2a2a45]'
            }`}
          >
            🦅 TAILS
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Flips</div>
            <div className="flex gap-2 flex-wrap justify-center">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    h.outcome === 'heads' ? 'bg-yellow-500/30' : 'bg-gray-500/30'
                  } ${h.won ? 'ring-2 ring-green-400' : ''}`}
                >
                  {h.outcome === 'heads' ? '👑' : '🦅'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div>
        <BetControls
          bet={bet}
          setBet={setBet}
          onPlay={flip}
          disabled={flipping}
          balance={state.balance}
          buttonText={flipping ? 'FLIPPING...' : 'FLIP COIN'}
        >
          <div className="bg-[#12121f] rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Multiplier</div>
            <div className="text-lg font-bold text-cyan-400">1.98x</div>
          </div>
        </BetControls>
      </div>
    </div>
  );
}
