import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// 5 Different Slot Machines with unique themes and paylines
const MACHINES = {
  classic: {
    name: 'Classic Fruits',
    symbols: ['7', 'BAR', 'Cherry', 'Lemon', 'Orange', 'Plum', 'Bell', 'Melon'],
    colors: ['#ff0000', '#444', '#ff4466', '#ffee00', '#ff8800', '#9944ff', '#ffcc00', '#00ff88'],
    payouts: { '777': 100, 'BARBARBAR': 50, 'BellBellBell': 25, 'MelonMelonMelon': 15, 'CherryCherryCherry': 10, 'OrangeOrangeOrange': 8, 'PlumPlumPlum': 6, 'LemonLemonLemon': 4 },
    bgColor: 'from-red-900 to-red-950'
  },
  gems: {
    name: 'Gem Rush',
    symbols: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Gold', 'Silver', 'Amethyst', 'Topaz'],
    colors: ['#00ffff', '#ff0044', '#00ff44', '#0044ff', '#ffd700', '#c0c0c0', '#9966ff', '#ffaa00'],
    payouts: { 'DiamondDiamondDiamond': 150, 'RubyRubyRuby': 75, 'EmeraldEmeraldEmerald': 40, 'SapphireSapphireSapphire': 30, 'GoldGoldGold': 20, 'AmethystAmethystAmethyst': 12, 'TopazTopazTopaz': 8, 'SilverSilverSilver': 5 },
    bgColor: 'from-purple-900 to-purple-950'
  },
  space: {
    name: 'Space Odyssey',
    symbols: ['Star', 'Planet', 'Rocket', 'Alien', 'Moon', 'Comet', 'UFO', 'Nebula'],
    colors: ['#ffff00', '#ff6600', '#ff3366', '#00ff00', '#aaaaaa', '#00ffff', '#ff00ff', '#6644ff'],
    payouts: { 'StarStarStar': 200, 'AlienAlienAlien': 80, 'RocketRocketRocket': 50, 'UFOUFOufo': 35, 'PlanetPlanetPlanet': 20, 'CometCometComet': 15, 'MoonMoonMoon': 10, 'NebulaNebulaNebula': 6 },
    bgColor: 'from-blue-900 to-slate-950'
  },
  egyptian: {
    name: 'Pharaoh\'s Gold',
    symbols: ['Pharaoh', 'Scarab', 'Ankh', 'Eye', 'Pyramid', 'Cat', 'Scroll', 'Lotus'],
    colors: ['#ffd700', '#00aa44', '#00ffff', '#ffcc00', '#ff8800', '#ff6688', '#f4e4bc', '#ff66aa'],
    payouts: { 'PharaohPharaohPharaoh': 250, 'ScarabScarabScarab': 100, 'AnkhAnkhAnkh': 60, 'EyeEyeEye': 40, 'PyramidPyramidPyramid': 25, 'CatCatCat': 15, 'ScrollScrollScroll': 10, 'LotusLotusLotus': 5 },
    bgColor: 'from-yellow-800 to-amber-950'
  },
  vegas: {
    name: 'Vegas Nights',
    symbols: ['Jackpot', 'Dice', 'Chips', 'Cards', 'Crown', 'Ring', 'Watch', 'Car'],
    colors: ['#ff0066', '#ffffff', '#00ff00', '#ff4444', '#ffd700', '#00ffff', '#ff8800', '#ff00ff'],
    payouts: { 'JackpotJackpotJackpot': 500, 'CrownCrownCrown': 120, 'RingRingRing': 70, 'DiceDiceDice': 45, 'ChipsChipsChips': 30, 'CardsCardsCards': 18, 'WatchWatchWatch': 12, 'CarCarCar': 8 },
    bgColor: 'from-pink-900 to-fuchsia-950'
  }
};

const HOUSE_EDGE = 0.04;

export default function SlotsGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(() => Math.floor(state.balance * 0.05) || 10);
  const [machineId, setMachineId] = useState('classic');
  const [reels, setReels] = useState([
    [0, 1, 2], [0, 1, 2], [0, 1, 2]
  ]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const animRefs = useRef([null, null, null]);

  const machine = MACHINES[machineId];
  const symbols = machine.symbols;

  const getSymbolDisplay = (idx) => {
    return symbols[idx] || symbols[0];
  };

  const spin = useCallback(() => {
    if (spinning.some(s => s) || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setResult(null);
    setSpinning([true, true, true]);
    audio.playBet();

    // Generate weighted results
    const finalSymbols = [];
    for (let i = 0; i < 3; i++) {
      const rand = Math.random();
      let idx;
      if (rand < 0.35) idx = Math.floor(Math.random() * 3) + 4; // Common symbols (idx 4-6)
      else if (rand < 0.6) idx = Math.floor(Math.random() * 2) + 2; // Medium symbols (idx 2-3)
      else if (rand < 0.85) idx = Math.floor(Math.random() * 2) + 5; // Less common
      else if (rand < 0.95) idx = 1; // Rare
      else idx = 0; // Very rare (top symbol)
      finalSymbols.push(idx);
    }

    // Animate each reel
    const animateReel = (reelIdx, duration) => {
      const startTime = Date.now();
      const finalIdx = finalSymbols[reelIdx];

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 0.85) {
          // Random spinning
          const randomSyms = [
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length),
            Math.floor(Math.random() * symbols.length)
          ];
          setReels(prev => {
            const next = [...prev];
            next[reelIdx] = randomSyms;
            return next;
          });
        } else {
          // Settle on final
          const above = (finalIdx + symbols.length - 1) % symbols.length;
          const below = (finalIdx + 1) % symbols.length;
          setReels(prev => {
            const next = [...prev];
            next[reelIdx] = [above, finalIdx, below];
            return next;
          });
        }

        if (progress < 1) {
          animRefs.current[reelIdx] = requestAnimationFrame(animate);
        } else {
          setSpinning(prev => {
            const next = [...prev];
            next[reelIdx] = false;
            return next;
          });
        }
      };
      animate();
    };

    const baseDelay = state.settings.fastMode ? 500 : 900;
    animateReel(0, baseDelay);
    setTimeout(() => animateReel(1, baseDelay), baseDelay / 2);
    setTimeout(() => animateReel(2, baseDelay), baseDelay);

    // Check results after all reels stop
    setTimeout(() => {
      const key = finalSymbols.map(i => symbols[i]).join('');
      const mult = machine.payouts[key] || 0;

      if (mult > 0) {
        const win = bet * mult;
        addWin(win, bet, 'slots', mult);
        setResult({ won: true, symbols: finalSymbols, mult, profit: win - bet });
        audio.playWin();
      } else if (finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2]) {
        // Two matching = small win
        const smallMult = 1.5;
        const win = bet * smallMult;
        addWin(win, bet, 'slots', smallMult);
        setResult({ won: true, symbols: finalSymbols, mult: smallMult, profit: win - bet });
        audio.playTick();
      } else {
        addWin(0, bet, 'slots', 0);
        setResult({ won: false, symbols: finalSymbols, mult: 0, profit: -bet });
        audio.playLose();
      }

      setHistory(h => [{ won: mult > 0 || finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2], mult: mult || (finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2] ? 1.5 : 0) }, ...h.slice(0, 4)]);
    }, baseDelay * 1.8);
  }, [spinning, bet, state.balance, state.settings.fastMode, machine, symbols, placeBet, addWin]);

  useEffect(() => {
    return () => animRefs.current.forEach(ref => ref && cancelAnimationFrame(ref));
  }, []);

  const isSpinning = spinning.some(s => s);

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-3">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Machine Selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {Object.entries(MACHINES).map(([id, m]) => (
            <button key={id}
              onClick={() => !isSpinning && setMachineId(id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                machineId === id
                  ? 'bg-gradient-to-r ' + m.bgColor + ' text-white ring-2 ring-white/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {m.name}
            </button>
          ))}
        </div>

        {/* Slot Machine */}
        <div className={`bg-gradient-to-b ${machine.bgColor} rounded-xl p-4 border-4 border-yellow-600 mb-4`}>
          <div className="text-center text-lg font-bold text-yellow-400 mb-3">{machine.name}</div>

          <div className="bg-black rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-2">
              {reels.map((reel, ri) => (
                <div key={ri} className="bg-gray-900 rounded-lg overflow-hidden">
                  {reel.map((symIdx, si) => (
                    <div key={si}
                      className={`text-center py-3 text-sm font-bold ${
                        si === 1 ? 'bg-gray-800 border-y-2 border-yellow-500 text-lg' : 'opacity-40'
                      }`}
                      style={{ color: machine.colors[symIdx] }}>
                      {getSymbolDisplay(symIdx)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win line indicators */}
          <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  result?.won && result.mult >= 3 ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'
                }`} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-3 rounded-lg mb-4 ${result.won ? 'bg-green-900/50' : 'bg-red-900/30'}`}>
            <div className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN ${result.mult}x` : 'NO WIN'}
            </div>
            {result.won && <div className="text-lg text-yellow-400">+${result.profit.toFixed(2)}</div>}
          </div>
        )}

        {/* Spin Button */}
        <button onClick={spin} disabled={isSpinning || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xl disabled:opacity-50">
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} disabled={isSpinning} />

        {/* Paytable */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">{machine.name} Payouts</div>
          <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
            {Object.entries(machine.payouts).slice(0, 5).map(([key, mult]) => {
              const sym = key.match(/[A-Z][a-z]*/g)?.[0] || key.slice(0, key.length / 3);
              return (
                <div key={key} className="flex justify-between bg-gray-800/50 px-2 py-1 rounded">
                  <span className="truncate">{sym} x3</span>
                  <span className={mult >= 50 ? 'text-yellow-400' : 'text-green-400'}>{mult}x</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
            2 matching = 1.5x
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult}x
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
