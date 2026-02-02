import { useCallback, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const ROWS = 12;
const MULTIPLIERS = {
  low: [5.6, 2.1, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 2.1, 5.6],
  medium: [13, 3, 1.5, 1, 0.7, 0.4, 0.7, 1, 1.5, 3, 13],
  high: [29, 4, 2, 0.6, 0.4, 0.2, 0.4, 0.6, 2, 4, 29]
};

export default function PlinkoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [balls, setBalls] = useState([]);
  const [dropping, setDropping] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([]);
  const ballIdRef = useRef(0);

  const multipliers = MULTIPLIERS[risk];
  const pegs = ROWS + 1;

  const dropBall = useCallback(() => {
    if (bet <= 0 || bet > state.balance || dropping) return;
    if (!placeBet(bet, 'plinko')) return;

    setDropping(true);
    setLastWin(null);

    const ballId = ++ballIdRef.current;
    let position = pegs / 2;
    const path = [position];

    // Simulate ball path
    for (let i = 0; i < ROWS; i++) {
      position += Math.random() > 0.5 ? 0.5 : -0.5;
      path.push(position);
    }

    const finalSlot = Math.round(position);
    const clampedSlot = Math.max(0, Math.min(multipliers.length - 1, finalSlot));
    const mult = multipliers[clampedSlot];

    setBalls(prev => [...prev, { id: ballId, path, currentStep: 0 }]);

    // Animate ball
    let step = 0;
    const animate = () => {
      step++;
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, currentStep: step } : b
      ));

      if (step < ROWS) {
        setTimeout(animate, 100);
      } else {
        // Ball reached bottom
        setTimeout(() => {
          const winAmount = bet * mult;
          addWin(winAmount, bet, 'plinko', mult);
          setLastWin({ mult, amount: winAmount });
          setHistory(h => [{ mult, slot: clampedSlot }, ...h.slice(0, 9)]);
          setBalls(prev => prev.filter(b => b.id !== ballId));
          setDropping(false);
        }, 200);
      }
    };

    setTimeout(animate, 100);
  }, [bet, state.balance, dropping, placeBet, addWin, multipliers, pegs]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6">
        {/* Plinko Board */}
        <div className="relative max-w-lg mx-auto">
          {/* Pegs */}
          {[...Array(ROWS)].map((_, row) => (
            <div key={row} className="flex justify-center gap-6 mb-4">
              {[...Array(row + 3)].map((_, peg) => (
                <div key={peg} className="w-2 h-2 rounded-full bg-gray-600" />
              ))}
            </div>
          ))}

          {/* Multiplier Slots */}
          <div className="flex justify-center gap-1 mt-4">
            {multipliers.map((mult, i) => (
              <div
                key={i}
                className={`px-2 py-2 rounded text-xs font-bold text-center min-w-[40px] ${
                  mult >= 5 ? 'bg-purple-500/30 text-purple-400' :
                  mult >= 2 ? 'bg-green-500/30 text-green-400' :
                  mult >= 1 ? 'bg-blue-500/30 text-blue-400' :
                  'bg-red-500/30 text-red-400'
                }`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {lastWin && (
          <div className="text-center mt-6">
            <div className={`text-4xl font-black ${lastWin.mult >= 1 ? 'text-green-400' : 'text-red-400'}`}>
              {lastWin.mult}x
            </div>
            <div className="text-xl text-gray-400">
              {lastWin.mult >= 1 ? '+' : ''}${(lastWin.amount - bet).toFixed(2)}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Drops</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.mult >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.mult}x
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
          onPlay={dropBall}
          disabled={dropping}
          balance={state.balance}
          buttonText={dropping ? 'DROPPING...' : 'DROP BALL'}
        >
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map(r => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  disabled={dropping}
                  className={`py-2 rounded-lg font-bold text-sm capitalize transition ${
                    risk === r
                      ? 'bg-cyan-500 text-white'
                      : 'bg-[#12121f] text-gray-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </BetControls>
      </div>
    </div>
  );
}
