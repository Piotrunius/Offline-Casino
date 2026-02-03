import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🎰'];
const PAYOUTS = {
  '🍒🍒🍒': 3, '🍋🍋🍋': 5, '🍊🍊🍊': 8, '🍇🍇🍇': 12,
  '⭐⭐⭐': 20, '💎💎💎': 50, '7️⃣7️⃣7️⃣': 100, '🎰🎰🎰': 250
};
const HOUSE_EDGE = 0.04;

export default function SlotsGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState([['🍒', '🍋', '🍊'], ['🍒', '🍋', '🍊'], ['🍒', '🍋', '🍊']]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState(null);
  const animRefs = useRef([null, null, null]);

  const spin = useCallback(() => {
    if (spinning.some(s => s) || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setResult(null);
    setSpinning([true, true, true]);
    audio.playBet();

    // Generate results
    const finalSymbols = [];
    for (let i = 0; i < 3; i++) {
      const rand = Math.random();
      // Weighted selection - higher payouts less likely
      let sym;
      if (rand < 0.3) sym = SYMBOLS[Math.floor(Math.random() * 3)]; // fruits
      else if (rand < 0.55) sym = SYMBOLS[3 + Math.floor(Math.random() * 2)]; // grapes/star
      else if (rand < 0.75) sym = SYMBOLS[5]; // diamond
      else if (rand < 0.9) sym = SYMBOLS[6]; // 7
      else sym = SYMBOLS[7]; // jackpot
      finalSymbols.push(sym);
    }

    // Animate each reel
    const animateReel = (reelIdx, duration) => {
      const startTime = Date.now();
      const finalSym = finalSymbols[reelIdx];

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Generate random symbols during spin
        if (progress < 0.9) {
          const randomSyms = Array(3).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
          setReels(prev => {
            const next = [...prev];
            next[reelIdx] = randomSyms;
            return next;
          });
        } else {
          // Settle on final
          const above = SYMBOLS[(SYMBOLS.indexOf(finalSym) + 7) % 8];
          const below = SYMBOLS[(SYMBOLS.indexOf(finalSym) + 1) % 8];
          setReels(prev => {
            const next = [...prev];
            next[reelIdx] = [above, finalSym, below];
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

    const baseDelay = state.settings.fastMode ? 400 : 800;
    animateReel(0, baseDelay);
    setTimeout(() => animateReel(1, baseDelay), baseDelay / 2);
    setTimeout(() => animateReel(2, baseDelay), baseDelay);

    // Check results after all reels stop
    setTimeout(() => {
      const key = finalSymbols.join('');
      const mult = PAYOUTS[key] || 0;

      if (mult > 0) {
        const win = bet * mult;
        addWin(win, bet, 'slots', mult);
        setResult({ won: true, symbols: finalSymbols, mult, profit: win - bet });
        audio.playWin();
      } else if (finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2]) {
        // Two in a row - small win
        const smallMult = 1.5;
        const win = bet * smallMult;
        addWin(win, bet, 'slots', smallMult);
        setResult({ won: true, symbols: finalSymbols, mult: smallMult, profit: win - bet });
        audio.playWin();
      } else {
        addWin(0, bet, 'slots', 0);
        setResult({ won: false, symbols: finalSymbols, mult: 0, profit: -bet });
        audio.playLose();
      }
    }, baseDelay * 2 + 200);
  }, [spinning, bet, state.balance, state.settings.fastMode, placeBet, addWin]);

  useEffect(() => {
    return () => animRefs.current.forEach(ref => ref && cancelAnimationFrame(ref));
  }, []);

  const isSpinning = spinning.some(s => s);

  return (
    <div className="max-w-md mx-auto">
      <div className="game-card p-4">
        <div className="text-xs text-gray-500 mb-3">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-4 border-4 border-yellow-600 mb-4">
          <div className="bg-black rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-2">
              {reels.map((reel, ri) => (
                <div key={ri} className="bg-gray-900 rounded-lg overflow-hidden">
                  {reel.map((sym, si) => (
                    <div key={si} className={`text-center py-2 text-3xl ${si === 1 ? 'bg-gray-800 border-y-2 border-yellow-500' : 'opacity-40'}`}>
                      {sym}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win Line Indicator */}
          <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-3 h-3 rounded-full ${result?.won && result.mult >= 3 ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
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
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-lg disabled:opacity-50 mb-4">
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>

        <BetControls bet={bet} setBet={setBet} onPlay={spin} buttonText="SPIN" hideButton />

        {/* Paytable */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 uppercase mb-2">Paytable</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(PAYOUTS).slice(0, 4).map(([syms, mult]) => (
              <div key={syms} className="flex justify-between bg-gray-800/50 px-2 py-1 rounded">
                <span>{syms}</span>
                <span className="text-green-400">{mult}x</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
            {Object.entries(PAYOUTS).slice(4).map(([syms, mult]) => (
              <div key={syms} className="flex justify-between bg-gray-800/50 px-2 py-1 rounded">
                <span>{syms}</span>
                <span className="text-yellow-400">{mult}x</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">2 matching = 1.5x</div>
        </div>
      </div>
    </div>
  );
}
