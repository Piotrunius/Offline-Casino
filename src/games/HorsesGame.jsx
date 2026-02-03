import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const HORSES = [
  { name: 'Thunder', color: '#ef4444', emoji: '🔴' },
  { name: 'Storm', color: '#3b82f6', emoji: '🔵' },
  { name: 'Blaze', color: '#22c55e', emoji: '🟢' },
  { name: 'Shadow', color: '#a855f7', emoji: '🟣' },
  { name: 'Spirit', color: '#f59e0b', emoji: '🟡' },
  { name: 'Nova', color: '#ec4899', emoji: '🩷' }
];

export default function HorsesGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [selectedHorse, setSelectedHorse] = useState(0);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState(HORSES.map(() => 0));
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode;
  const MULTIPLIER = 5;

  const race = useCallback(async () => {
    if (racing || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'horses');
    if (!confirmed) return;

    setRacing(true);
    setResult(null);
    setPositions(HORSES.map(() => 0));
    audio.playBet();

    const duration = state.settings.fastMode ? 2500 : 5000;
    const startTime = Date.now();

    // Determine winner
    const winner = godMode ? selectedHorse : Math.floor(Math.random() * HORSES.length);

    // Speed factors - winner gets slight boost
    const speedFactors = HORSES.map((_, i) => {
      const base = 0.8 + Math.random() * 0.2;
      return i === winner ? base + 0.15 : base;
    });

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      const newPositions = speedFactors.map((speed, i) => {
        const baseProgress = progress * speed;
        // Add wobble for excitement
        const wobble = Math.sin(elapsed / 80 + i * 1.5) * 0.015;
        return Math.min(1, baseProgress + (progress < 0.9 ? wobble : 0));
      });

      // Ensure winner finishes first at the end
      if (progress > 0.85) {
        const maxOther = Math.max(...newPositions.filter((_, i) => i !== winner));
        newPositions[winner] = Math.max(newPositions[winner], maxOther + 0.02);
      }

      setPositions(newPositions);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setRacing(false);
        const won = winner === selectedHorse;

        setHistory(h => [{ winner, ...HORSES[winner] }, ...h.slice(0, 4)]);

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
    <div className="h-full flex gap-3 p-2">
      {/* Race Track */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-3 flex flex-col">
        {/* Track Header */}
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
          <span>START</span>
          <span className="text-yellow-500 font-bold">🏆 FINISH</span>
        </div>

        {/* Race Lanes */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {HORSES.map((horse, i) => (
            <div key={i} className="relative h-10">
              {/* Lane Background */}
              <div
                className={`absolute inset-0 rounded-lg transition-all ${
                  selectedHorse === i
                    ? 'bg-white/10 ring-2'
                    : 'bg-black/30'
                }`}
                style={{
                  ringColor: selectedHorse === i ? horse.color : 'transparent',
                  borderLeft: `3px solid ${horse.color}`
                }}
              />

              {/* Finish Line */}
              <div className="absolute right-2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400/50 via-white/50 to-yellow-400/50" />

              {/* Horse */}
              <div
                className="absolute top-1 bottom-1 flex items-center transition-all duration-75"
                style={{ left: `calc(${positions[i] * 88}% + 8px)` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform"
                  style={{
                    backgroundColor: horse.color,
                    transform: racing ? `scaleX(${1 + Math.sin(Date.now() / 50) * 0.1})` : 'scaleX(1)'
                  }}
                >
                  {i + 1}
                </div>
                {racing && <span className="ml-1 animate-bounce">🏃</span>}
              </div>

              {/* Horse Label */}
              {!racing && (
                <div
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: horse.color }}
                >
                  {horse.name}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-3 px-4 py-3 rounded-xl text-center ${
            result.won ? 'bg-green-900/50' : 'bg-red-900/50'
          }`}>
            <div className={`text-lg font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? '🎉 YOU WIN!' : 'Better luck next time!'}
            </div>
            <div className="text-sm text-gray-400">
              Winner: <span style={{ color: HORSES[result.winner].color }}>{HORSES[result.winner].name}</span>
              <span className="ml-2">
                {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-72 bg-[#0a0a12] rounded-2xl p-3 flex flex-col gap-3">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={racing}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <button onClick={() => handleBetChange(1)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">MAX</button>
          </div>
        </div>

        {/* Horse Selection */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Pick Your Horse</label>
          <div className="grid grid-cols-3 gap-1">
            {HORSES.map((horse, i) => (
              <button
                key={i}
                onClick={() => !racing && setSelectedHorse(i)}
                disabled={racing}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  selectedHorse === i
                    ? 'ring-2 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
                style={{
                  backgroundColor: selectedHorse === i ? horse.color : undefined,
                  ringColor: horse.color
                }}
              >
                <span className="text-lg">{horse.emoji}</span>
                <span className="truncate w-full text-center">{horse.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Win Multiplier</div>
          <div className="text-xl font-bold text-yellow-400">{MULTIPLIER + 1}x</div>
          <div className="text-xs text-gray-500">Potential Win: ${(bet * (MULTIPLIER + 1)).toFixed(2)}</div>
        </div>

        {/* Race Button */}
        <button
          onClick={race}
          disabled={racing || bet <= 0 || bet > state.balance}
          className={`py-3 rounded-xl font-bold transition-all ${
            racing
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
          }`}
        >
          {racing ? '🏇 RACING...' : '🏁 START RACE'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Recent Winners</div>
            <div className="flex gap-1 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: `${h.color}40`, color: h.color }}
                >
                  {h.emoji} {h.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
