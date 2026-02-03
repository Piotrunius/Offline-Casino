import { useCallback, useState, useRef, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const HORSE_NAMES = ['Thunder', 'Lightning', 'Storm', 'Blaze', 'Shadow', 'Spirit'];
const HORSE_COLORS = ['#ff4444', '#4488ff', '#44ff44', '#ffaa00', '#aa44ff', '#ff44aa'];

export default function HorsesGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [selectedHorse, setSelectedHorse] = useState(0);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState([0, 0, 0, 0, 0, 0]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode;
  const MULTIPLIER = 6; // 6:1 payout

  const race = useCallback(async () => {
    if (racing || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'horses');
    if (!confirmed) return;

    setRacing(true);
    setResult(null);
    setPositions([0, 0, 0, 0, 0, 0]);
    audio.playBet();

    const duration = state.settings.fastMode ? 3000 : 6000;
    const startTime = Date.now();
    
    // Determine winner
    let winner;
    if (godMode) {
      winner = selectedHorse;
    } else {
      winner = Math.floor(Math.random() * 6);
    }

    // Generate random speed factors for each horse
    const speedFactors = Array(6).fill(0).map((_, i) => {
      if (i === winner) return 1.0 + Math.random() * 0.1; // Winner is slightly faster
      return 0.7 + Math.random() * 0.25;
    });

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Add randomness to make it exciting
      const newPositions = speedFactors.map((speed, i) => {
        const baseProgress = progress * speed;
        const wobble = Math.sin(elapsed / 100 + i * 2) * 0.02;
        return Math.min(1, baseProgress + (progress < 0.9 ? wobble : 0));
      });

      // Ensure winner finishes first in the last stretch
      if (progress > 0.85) {
        newPositions[winner] = Math.max(...newPositions) + 0.01;
      }

      setPositions(newPositions);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setRacing(false);
        const won = winner === selectedHorse;

        setHistory(h => [{ winner, horseName: HORSE_NAMES[winner], color: HORSE_COLORS[winner] }, ...h.slice(0, 3)]);

        if (won) {
          const winAmount = bet * (MULTIPLIER + 1);
          addWin(winAmount, bet, 'horses', MULTIPLIER + 1);
          setResult({ won: true, winner, profit: winAmount - bet });
          audio.playWin();
        } else {
          addWin(0, bet, 'horses', 0);
          setResult({ won: false, winner, profit: -bet });
          audio.playLose();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [racing, bet, state.balance, selectedHorse, godMode, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col">
        {/* Race Track */}
        <div className="flex-1 bg-gradient-to-b from-green-900/30 to-green-800/20 rounded-xl p-4 relative">
          {/* Track Header */}
          <div className="absolute top-2 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
            <span>START</span>
            <span>FINISH</span>
          </div>

          {/* Finish Line */}
          <div className="absolute right-8 top-8 bottom-8 w-1 bg-gradient-to-b from-white/50 via-red-500/50 to-white/50" />

          {/* Lanes */}
          <div className="mt-8 space-y-3">
            {HORSE_NAMES.map((name, i) => (
              <div key={i} className="relative">
                {/* Lane Background */}
                <div className={`h-12 rounded-lg bg-black/30 border-l-4 ${
                  selectedHorse === i ? 'border-yellow-400' : 'border-transparent'
                }`}>
                  {/* Horse */}
                  <div
                    className="absolute top-1 bottom-1 transition-all duration-100 flex items-center"
                    style={{ 
                      left: `${positions[i] * 85 + 2}%`,
                    }}
                  >
                    {/* Horse Icon */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: HORSE_COLORS[i] }}
                    >
                      {i + 1}
                    </div>
                    {racing && (
                      <div className="ml-1 text-xs text-gray-400 animate-pulse">
                        🏇
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Horse Name */}
                <div className="absolute left-[-80px] top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 w-20 text-right">
                  #{i + 1} {name}
                </div>
              </div>
            ))}
          </div>

          {/* Race Result */}
          {result && (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl ${
              result.won ? 'bg-green-900/80 text-green-400' : 'bg-red-900/80 text-red-400'
            }`}>
              <div className="text-center">
                <div className="text-sm mb-1">
                  Winner: <span className="font-bold" style={{ color: HORSE_COLORS[result.winner] }}>
                    #{result.winner + 1} {HORSE_NAMES[result.winner]}
                  </span>
                </div>
                <div className="text-xl font-bold">
                  {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={racing}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button onClick={() => handleBetChange(1)} disabled={racing} className="btn-secondary py-2 text-sm font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={racing} className="btn-secondary py-2 text-sm font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={racing} className="btn-secondary py-2 text-sm font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={racing} className="btn-secondary py-2 text-sm font-bold">MAX</button>
          </div>
        </div>

        {/* Select Horse */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Select Your Horse</label>
          <div className="grid grid-cols-3 gap-2">
            {HORSE_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setSelectedHorse(i)}
                disabled={racing}
                className={`p-3 rounded-xl transition-all ${
                  selectedHorse === i
                    ? 'ring-2 ring-yellow-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ backgroundColor: `${HORSE_COLORS[i]}30` }}
              >
                <div 
                  className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: HORSE_COLORS[i] }}
                >
                  {i + 1}
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">{name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-black/30 rounded-xl p-3">
          <div className="flex justify-between text-gray-400">
            <span>Selected:</span>
            <span className="font-bold" style={{ color: HORSE_COLORS[selectedHorse] }}>
              #{selectedHorse + 1} {HORSE_NAMES[selectedHorse]}
            </span>
          </div>
          <div className="flex justify-between text-gray-400 mt-1">
            <span>Payout:</span>
            <span className="text-green-400 font-bold">{MULTIPLIER + 1}x</span>
          </div>
        </div>

        {/* Race Button */}
        <button
          onClick={race}
          disabled={racing || bet <= 0 || bet > state.balance}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            racing
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
          }`}
        >
          {racing ? '🏇 RACING...' : 'START RACE'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">Recent Winners</div>
            <div className="flex gap-2">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold group relative cursor-help"
                  style={{ backgroundColor: h.color }}
                >
                  {h.winner + 1}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 w-24 z-10 text-center whitespace-nowrap font-normal">
                    {h.horseName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
