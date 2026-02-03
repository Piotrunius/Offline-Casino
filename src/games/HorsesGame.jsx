import { useCallback, useEffect, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const FIRST_NAMES = ['Thunder', 'Storm', 'Blaze', 'Shadow', 'Spirit', 'Nova', 'Lightning', 'Midnight', 'Golden', 'Silver', 'Dark', 'Swift', 'Wild', 'Royal', 'Lucky'];
const SECOND_NAMES = ['Runner', 'Bolt', 'Star', 'Dream', 'Fire', 'Wind', 'Strike', 'Dash', 'Flash', 'Glory', 'Knight', 'Prince', 'Storm', 'Rider', 'Champion'];

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ec4899'];

const generateHorse = (index) => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const secondName = SECOND_NAMES[Math.floor(Math.random() * SECOND_NAMES.length)];
  const name = `${firstName} ${secondName}`;

  const speed = 50 + Math.floor(Math.random() * 50);
  const stamina = 50 + Math.floor(Math.random() * 50);
  const form = Math.floor(Math.random() * 5) + 1;

  const baseChance = (speed * 0.4 + stamina * 0.3 + form * 10) / 100;

  return {
    id: index,
    name,
    color: COLORS[index],
    speed,
    stamina,
    form,
    baseChance,
    wins: Math.floor(Math.random() * 10),
    races: 10 + Math.floor(Math.random() * 20)
  };
};

const calculateOdds = (horses) => {
  const totalChance = horses.reduce((sum, h) => sum + h.baseChance, 0);
  return horses.map(h => {
    const winProb = h.baseChance / totalChance;
    const odds = Math.max(1.5, Math.min(15, (1 / winProb) * 0.9));
    return { ...h, odds: Math.round(odds * 10) / 10, winProb };
  });
};

export default function HorsesGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [horses, setHorses] = useState(() => {
    const initial = Array(6).fill(null).map((_, i) => generateHorse(i));
    return calculateOdds(initial);
  });
  const [selectedHorse, setSelectedHorse] = useState(0);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState(horses.map(() => 0));
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [raceNumber, setRaceNumber] = useState(1);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode || state.adminSettings?.gameSettings?.horses?.alwaysWin;

  // Generate new horses every race
  useEffect(() => {
    if (raceNumber > 1) {
      const newHorses = Array(6).fill(null).map((_, i) => generateHorse(i));
      setHorses(calculateOdds(newHorses));
    }
  }, [raceNumber]);

  const race = useCallback(async () => {
    if (racing || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'horses');
    if (!confirmed) return;

    setRacing(true);
    setResult(null);
    setPositions(horses.map(() => 0));
    audio.playBet();

    // Determine winner
    let winner;
    if (godMode) {
      winner = selectedHorse;
    } else {
      const totalProb = horses.reduce((sum, h) => sum + h.winProb, 0);
      let random = Math.random() * totalProb;
      winner = 0;
      for (let i = 0; i < horses.length; i++) {
        random -= horses[i].winProb;
        if (random <= 0) {
          winner = i;
          break;
        }
      }
    }

    const duration = state.settings?.fastMode ? 3000 : 5500;
    const startTime = Date.now();

    // Horse individual acceleration factors (more realistic)
    const accelerations = horses.map((horse, i) => {
      const base = 0.5 + (horse.speed / 200) * 0.6 + (horse.stamina / 200) * 0.4;
      const random = 0.9 + Math.random() * 0.2;
      // Winner is consistently faster
      return i === winner ? base * random * 1.15 : base * random;
    });

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = elapsed / duration;

      // More realistic easing: slow start, fast middle, slow end
      let eased;
      if (rawProgress < 0.2) {
        // Acceleration phase
        eased = rawProgress * rawProgress * 2.5;
      } else if (rawProgress < 0.85) {
        // Cruise phase
        eased = 0.1 + (rawProgress - 0.2) * 1.12;
      } else {
        // Deceleration phase
        const remaining = 1 - rawProgress;
        eased = 1 - remaining * remaining * 5;
      }

      const finalProgress = Math.min(1, eased);

      // Calculate positions with more realistic behavior
      const newPositions = accelerations.map((accel, i) => {
        // Base movement
        let pos = finalProgress * accel;

        // Add realistic "stride" wobble (galloping motion)
        if (finalProgress < 0.9) {
          const stridePhase = (elapsed / 100 + i * 0.5) % 1;
          const wobble = Math.sin(stridePhase * Math.PI * 2) * 0.015 * (1 - finalProgress);
          pos += wobble;
        }

        return Math.min(1, pos);
      });

      // Enforce winner lead in final moments
      if (finalProgress > 0.7) {
        const winnerPos = newPositions[winner];
        const maxOtherPos = Math.max(...newPositions.filter((_, i) => i !== winner));

        // Winner must maintain clear lead
        if (winnerPos < maxOtherPos + 0.02) {
          newPositions[winner] = maxOtherPos + 0.03 + (finalProgress - 0.7) * 0.15;
        }
      }

      // Hard finish line
      if (finalProgress >= 0.98) {
        newPositions[winner] = 1.0;
        for (let i = 0; i < newPositions.length; i++) {
          if (i !== winner) {
            newPositions[i] = Math.min(0.98, newPositions[i]);
          }
        }
      }

      setPositions(newPositions);

      if (finalProgress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Race complete
        setRacing(false);
        setRaceNumber(prev => prev + 1);

        const won = winner === selectedHorse;
        const winningHorse = horses[winner];
        const multiplier = winningHorse.odds;

        setHistory(h => [{
          winner,
          name: winningHorse.name,
          color: winningHorse.color,
          odds: multiplier
        }, ...h.slice(0, 4)]);

        // Update horse records
        setHorses(prev => prev.map((h, i) => ({
          ...h,
          races: h.races + 1,
          wins: i === winner ? h.wins + 1 : h.wins
        })));

        if (won) {
          const winAmount = bet * multiplier;
          addWin(winAmount, bet, 'horses', multiplier);
          setResult({ won: true, winner, profit: winAmount - bet, odds: multiplier });
          audio.playWin();
        } else {
          addWin(0, bet, 'horses', 0);
          setResult({ won: false, winner, profit: -bet, odds: multiplier });
          audio.playLose();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [racing, bet, state.balance, selectedHorse, godMode, state.settings?.fastMode, horses, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const selectedOdds = horses[selectedHorse]?.odds || 2;

  return (
    <div className="h-full flex gap-3 p-2 overflow-hidden">
      {/* Race Track */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-3 flex flex-col min-h-0">
        {/* Track Header */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-2 flex-shrink-0">
          <span>Race #{raceNumber}</span>
          <span className="text-yellow-500 font-bold">FINISH LINE</span>
        </div>

        {/* Race Lanes */}
        <div className="flex-1 flex flex-col justify-center gap-2 min-h-0">
          {horses.map((horse, i) => (
            <div key={i} className="relative h-10 group">
              {/* Lane Background */}
              <div
                className={`absolute inset-0 rounded-lg transition-all ${
                  selectedHorse === i
                    ? 'bg-white/10 ring-2'
                    : 'bg-black/30'
                }`}
                style={{
                  ringColor: selectedHorse === i ? horse.color : 'transparent',
                  borderLeft: `4px solid ${horse.color}`
                }}
              />

              {/* Finish Line */}
              <div className="absolute right-2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400/50 via-white/50 to-yellow-400/50" />

              {/* Horse */}
              <div
                className="absolute top-1 bottom-1 flex items-center transition-all duration-75"
                style={{ left: `calc(${positions[i] * 90}% + 8px)` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2"
                  style={{
                    backgroundColor: horse.color,
                    borderColor: 'rgba(255,255,255,0.3)',
                    transform: racing ? `scaleX(${1 + Math.sin(Date.now() / 50) * 0.06})` : 'scaleX(1)'
                  }}
                >
                  {i + 1}
                </div>
              </div>

              {/* Horse Info */}
              {!racing && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-gray-400">{horse.odds}x</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-2 px-4 py-2 rounded-xl text-center flex-shrink-0 ${
            result.won ? 'bg-green-900/50' : 'bg-red-900/50'
          }`}>
            <div className={`text-base font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? 'YOU WIN!' : 'Better luck next time!'}
            </div>
            <div className="text-sm text-gray-400">
              Winner: <span style={{ color: horses[result.winner].color }}>{horses[result.winner].name}</span>
              <span className="ml-2">
                {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
        {/* Bet Amount */}
        <div className="flex-shrink-0">
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
            <button onClick={() => handleBetChange(bet / 2)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">1/2</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">2X</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={racing} className="btn-secondary py-1.5 text-xs font-bold">MAX</button>
          </div>
        </div>

        {/* Horse Selection */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Pick Your Horse</label>
          <div className="space-y-1">
            {horses.map((horse, i) => (
              <button
                key={i}
                onClick={() => !racing && setSelectedHorse(i)}
                disabled={racing}
                className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedHorse === i
                    ? 'ring-2 bg-white/10'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
                style={{ ringColor: horse.color }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: horse.color }}
                >
                  {i + 1}
                </div>

                <div className="flex-1 text-left">
                  <div className="text-white truncate">{horse.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>SPD: {horse.speed}</span>
                    <span>STA: {horse.stamina}</span>
                    <span className="text-yellow-400">{'★'.repeat(horse.form)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${horse.odds >= 5 ? 'text-green-400' : horse.odds >= 3 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {horse.odds}x
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {horse.wins}/{horse.races} wins
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-black/30 rounded-lg p-2 text-center flex-shrink-0">
          <div className="text-xs text-gray-500">Your Pick: <span style={{ color: horses[selectedHorse].color }}>{horses[selectedHorse].name}</span></div>
          <div className="text-xl font-bold text-yellow-400">{selectedOdds}x</div>
          <div className="text-xs text-gray-500">Potential Win: ${(bet * selectedOdds).toFixed(2)}</div>
        </div>

        {/* Race Button */}
        <button
          onClick={race}
          disabled={racing || bet <= 0 || bet > state.balance}
          className={`py-3 rounded-xl font-bold transition-all flex-shrink-0 ${
            racing
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
          }`}
        >
          {racing ? 'RACING...' : 'START RACE'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="flex-shrink-0">
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Recent Winners</div>
            <div className="flex gap-1 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded text-[10px] font-bold"
                  style={{ backgroundColor: `${h.color}40`, color: h.color }}
                >
                  {h.name.split(' ')[0]} ({h.odds}x)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
