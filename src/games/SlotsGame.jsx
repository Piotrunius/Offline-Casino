import { useCallback, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐'];
const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 5,
  '🔔': 10,
  '💎': 15,
  '7️⃣': 25,
  '⭐': 50
};

const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

const Reel = ({ symbols, spinning, delay }) => {
  return (
    <div className="bg-[#0a0a14] rounded-xl p-2 overflow-hidden h-[200px]">
      <div
        className={`flex flex-col items-center justify-center h-full transition-all duration-500 ${
          spinning ? 'animate-spin-slot' : ''
        }`}
        style={{ animationDelay: `${delay}ms` }}
      >
        {symbols.map((sym, i) => (
          <div
            key={i}
            className={`text-5xl py-2 ${i === 1 ? 'scale-125' : 'opacity-50 scale-90'}`}
          >
            {sym}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SlotsGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState([
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
  ]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const spinSound = useRef(null);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setSpinning(true);
    setResult(null);

    // Generate final results
    const finalReels = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];

    // Animate each reel stopping
    setTimeout(() => {
      setReels(r => [finalReels[0], r[1], r[2]]);
    }, 500);

    setTimeout(() => {
      setReels(r => [r[0], finalReels[1], r[2]]);
    }, 1000);

    setTimeout(() => {
      setReels(finalReels);
      setSpinning(false);

      // Calculate win
      const middleRow = [finalReels[0][1], finalReels[1][1], finalReels[2][1]];
      const { won, multiplier, winLine } = calculateWin(middleRow);

      const winAmount = won ? bet * multiplier : 0;
      addWin(winAmount, bet, 'slots', won ? multiplier : 0);

      setResult({
        won,
        multiplier,
        profit: (winAmount - bet).toFixed(2),
        winLine
      });

      setHistory(h => [{ won, symbols: middleRow }, ...h.slice(0, 9)]);
    }, 1500);
  }, [bet, spinning, state.balance, placeBet, addWin]);

  const calculateWin = (row) => {
    // Check for three of a kind
    if (row[0] === row[1] && row[1] === row[2]) {
      return {
        won: true,
        multiplier: SYMBOL_VALUES[row[0]] * 3,
        winLine: `${row[0]} ${row[1]} ${row[2]}`
      };
    }

    // Check for two of a kind
    if (row[0] === row[1] || row[1] === row[2] || row[0] === row[2]) {
      const matchedSymbol = row[0] === row[1] ? row[0] : (row[1] === row[2] ? row[1] : row[0]);
      return {
        won: true,
        multiplier: SYMBOL_VALUES[matchedSymbol],
        winLine: `Pair of ${matchedSymbol}`
      };
    }

    // Check for any 7 or star
    if (row.includes('7️⃣') || row.includes('⭐')) {
      return {
        won: true,
        multiplier: 1.5,
        winLine: 'Lucky Symbol!'
      };
    }

    return { won: false, multiplier: 0, winLine: null };
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Slot Machine */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white">🎰 LUCKY SLOTS 🎰</h2>
        </div>

        {/* Slot Display */}
        <div className="bg-gradient-to-b from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border-4 border-yellow-500/50">
          <div className="grid grid-cols-3 gap-4">
            {reels.map((reel, i) => (
              <Reel
                key={i}
                symbols={reel}
                spinning={spinning}
                delay={i * 200}
              />
            ))}
          </div>

          {/* Win Line Indicator */}
          <div className="relative h-0">
            <div className="absolute left-0 right-0 top-[-100px] h-[2px] bg-yellow-500 opacity-50" />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-6">
            <div className={`text-3xl font-black mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '🎉 WIN! 🎉' : 'NO WIN'}
            </div>
            {result.winLine && (
              <div className="text-xl text-yellow-400 mb-2">{result.winLine}</div>
            )}
            <div className={`text-2xl font-bold ${parseFloat(result.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(result.profit) >= 0 ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* Paytable */}
        <div className="mt-8 grid grid-cols-4 gap-2">
          {SYMBOLS.map(sym => (
            <div key={sym} className="bg-[#0a0a14] rounded-lg p-2 text-center">
              <div className="text-2xl">{sym}</div>
              <div className="text-xs text-gray-400">x{SYMBOL_VALUES[sym]}</div>
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Spins</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.symbols.join(' ')}
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
          onPlay={spin}
          disabled={spinning}
          balance={state.balance}
          buttonText="SPIN"
        />

        {/* Info */}
        <div className="mt-4 bg-[#1a1a2e] rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">How to Win</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• 3 of a kind = Symbol value × 3</p>
            <p>• 2 of a kind = Symbol value</p>
            <p>• Any 7️⃣ or ⭐ = 1.5×</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slot {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        .animate-spin-slot {
          animation: spin-slot 0.1s linear infinite;
        }
      `}</style>
    </div>
  );
}
