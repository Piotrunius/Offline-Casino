import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const BET_TYPES = [
  { id: 'red', label: 'Red', multiplier: 2, check: (n) => RED_NUMBERS.includes(n) },
  { id: 'black', label: 'Black', multiplier: 2, check: (n) => n !== 0 && !RED_NUMBERS.includes(n) },
  { id: 'odd', label: 'Odd', multiplier: 2, check: (n) => n !== 0 && n % 2 === 1 },
  { id: 'even', label: 'Even', multiplier: 2, check: (n) => n !== 0 && n % 2 === 0 },
  { id: '1-18', label: '1-18', multiplier: 2, check: (n) => n >= 1 && n <= 18 },
  { id: '19-36', label: '19-36', multiplier: 2, check: (n) => n >= 19 && n <= 36 },
  { id: '1st12', label: '1st 12', multiplier: 3, check: (n) => n >= 1 && n <= 12 },
  { id: '2nd12', label: '2nd 12', multiplier: 3, check: (n) => n >= 13 && n <= 24 },
  { id: '3rd12', label: '3rd 12', multiplier: 3, check: (n) => n >= 25 && n <= 36 },
];

export default function RouletteGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [bets, setBets] = useState({});
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]);

  const totalBet = Object.values(bets).reduce((sum, b) => sum + b, 0);

  const placeBetOnType = (type) => {
    if (spinning) return;
    if (totalBet + bet > state.balance) return;
    setBets(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + bet
    }));
  };

  const clearBets = () => {
    if (!spinning) {
      setBets({});
      setResult(null);
    }
  };

  const spin = useCallback(() => {
    if (totalBet <= 0 || totalBet > state.balance || spinning) return;
    if (!placeBet(totalBet, 'roulette')) return;

    setSpinning(true);
    setResult(null);

    const winningNumber = Math.floor(Math.random() * 37);

    // Animate wheel
    const spins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = (winningNumber / 37) * 360;
    const finalRotation = rotation + (spins * 360) + (360 - targetAngle);
    setRotation(finalRotation);

    setTimeout(() => {
      // Calculate winnings
      let totalWin = 0;

      Object.entries(bets).forEach(([betType, amount]) => {
        const betConfig = BET_TYPES.find(b => b.id === betType);
        if (betConfig && betConfig.check(winningNumber)) {
          totalWin += amount * betConfig.multiplier;
        }
      });

      if (totalWin > 0) {
        addWin(totalWin, totalBet, 'roulette', totalWin / totalBet);
        setResult({ won: true, number: winningNumber, profit: (totalWin - totalBet).toFixed(2) });
      } else {
        addWin(0, totalBet, 'roulette', 0);
        setResult({ won: false, number: winningNumber, profit: (-totalBet).toFixed(2) });
      }

      setHistory(h => [{ number: winningNumber, won: totalWin > 0 }, ...h.slice(0, 14)]);
      setSpinning(false);
      setBets({});
    }, 4000);
  }, [totalBet, state.balance, spinning, bets, rotation, placeBet, addWin]);

  const getNumberColor = (n) => {
    if (n === 0) return 'bg-green-600';
    return RED_NUMBERS.includes(n) ? 'bg-red-600' : 'bg-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Roulette Wheel & Table */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6">
        {/* Wheel */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div
            className="w-full h-full rounded-full border-8 border-yellow-600 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
            <div className="w-16 h-16 rounded-full bg-yellow-600 flex items-center justify-center">
              {result && (
                <span className={`text-xl font-black ${result.number === 0 ? 'text-green-400' : RED_NUMBERS.includes(result.number) ? 'text-red-400' : 'text-white'}`}>
                  {result.number}
                </span>
              )}
            </div>
          </div>
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${getNumberColor(result.number)}`}>
              <span className="text-2xl font-black text-white">{result.number}</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* Betting Table */}
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {BET_TYPES.map(bt => (
            <button
              key={bt.id}
              onClick={() => placeBetOnType(bt.id)}
              disabled={spinning}
              className={`py-3 rounded-lg font-bold text-sm transition ${
                bets[bt.id]
                  ? 'bg-cyan-500 text-white'
                  : bt.id === 'red'
                    ? 'bg-red-600/30 text-red-400 hover:bg-red-600/50'
                    : bt.id === 'black'
                      ? 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                      : 'bg-[#12121f] text-gray-400 hover:bg-[#1f1f35] hover:text-white'
              } disabled:opacity-50`}
            >
              {bt.label}
              {bets[bt.id] && <span className="block text-xs">${bets[bt.id]}</span>}
            </button>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Spins</div>
            <div className="flex gap-1 flex-wrap justify-center">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getNumberColor(h.number)}`}
                >
                  {h.number}
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
          disabled={spinning || totalBet === 0}
          balance={state.balance}
          buttonText={spinning ? 'SPINNING...' : totalBet === 0 ? 'PLACE BETS' : `SPIN ($${totalBet})`}
        >
          <button
            onClick={clearBets}
            disabled={spinning}
            className="w-full py-2 bg-[#12121f] text-gray-400 rounded-lg font-bold hover:text-white disabled:opacity-50 transition"
          >
            Clear Bets
          </button>

          <div className="bg-[#12121f] rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Total Bet</div>
            <div className="text-xl font-bold text-cyan-400">${totalBet.toFixed(2)}</div>
          </div>
        </BetControls>
      </div>
    </div>
  );
}
