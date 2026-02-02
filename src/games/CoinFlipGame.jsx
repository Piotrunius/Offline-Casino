import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomResult = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % 2 === 0 ? 'heads' : 'tails';
};

const CoinFlipGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [selectedSide, setSelectedSide] = useState('heads');
  const [flipResult, setFlipResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [history, setHistory] = useState([]);
  const [lastWin, setLastWin] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const flip = useCallback(async () => {
    if (isFlipping || betAmount > balance) return;

    subtractBalance(betAmount);
    setIsFlipping(true);
    setShowResult(false);
    setLastWin(null);
    if (soundEnabled) playSound('coinFlip');

    // Determine result BEFORE animation
    const result = getRandomResult();
    setFlipResult(result);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsFlipping(false);
    setShowResult(true);
    if (soundEnabled) playSound('coinLand');

    const won = result === selectedSide;
    setHistory((prev) => [{ result, won, bet: selectedSide }, ...prev.slice(0, 19)]);

    if (won) {
      const winAmount = betAmount * 1.98;
      addBalance(winAmount);
      setLastWin(winAmount);
      if (soundEnabled) playSound('betWin');
    } else {
      if (soundEnabled) playSound('betLose');
    }
  }, [isFlipping, betAmount, balance, selectedSide, subtractBalance, addBalance, soundEnabled]);

  // Calculate rotation - heads is 0deg, tails is 180deg
  const getRotation = () => {
    if (isFlipping) {
      // During flip: spin multiple times then land on correct side
      return flipResult === 'tails' ? 1980 : 1800; // 5 full rotations + correct side
    }
    if (flipResult) {
      return flipResult === 'tails' ? 180 : 0;
    }
    return 0;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          {/* Coin */}
          <div className="relative" style={{ perspective: '1000px' }}>
            <motion.div
              animate={{ rotateY: getRotation() }}
              transition={{
                duration: isFlipping ? 2 : 0.5,
                ease: isFlipping ? [0.25, 0.1, 0.25, 1] : 'easeOut'
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-40 h-40 md:w-56 md:h-56"
            >
              {/* Heads side */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-500 shadow-2xl"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="text-6xl md:text-8xl font-black text-yellow-800">H</div>
                  <div className="text-xs md:text-sm font-bold text-yellow-700 uppercase tracking-wider">Heads</div>
                </div>
              </div>
              {/* Tails side */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center border-4 border-gray-400 shadow-2xl"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="text-center">
                  <div className="text-6xl md:text-8xl font-black text-gray-700">T</div>
                  <div className="text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">Tails</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Result display */}
          <AnimatePresence>
            {showResult && flipResult && !isFlipping && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 text-center">
                <div className={`text-3xl font-black uppercase ${flipResult === selectedSide ? 'text-casino-green' : 'text-casino-red'}`}>
                  {flipResult === selectedSide ? 'YOU WIN!' : 'YOU LOSE'}
                </div>
                {lastWin && <div className="text-2xl text-casino-gold font-bold mt-2">+${lastWin.toFixed(2)}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-1 justify-center flex-wrap max-h-20 overflow-hidden">
              {history.slice(0, 15).map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    h.won ? 'bg-casino-green/20 text-casino-green border border-casino-green' : 'bg-casino-red/20 text-casino-red border border-casino-red'
                  }`}
                >
                  {h.result === 'heads' ? 'H' : 'T'}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {/* Side selection */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase mb-3 block">Choose Side</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => !isFlipping && setSelectedSide('heads')}
              disabled={isFlipping}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                selectedSide === 'heads'
                  ? 'bg-yellow-500 text-yellow-900 ring-2 ring-yellow-400'
                  : 'bg-casino-bg text-gray-400 hover:text-white border border-casino-border'
              }`}
            >
              <div className="text-3xl mb-1">H</div>
              <div className="text-xs uppercase">Heads</div>
            </button>
            <button
              onClick={() => !isFlipping && setSelectedSide('tails')}
              disabled={isFlipping}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                selectedSide === 'tails'
                  ? 'bg-gray-400 text-gray-800 ring-2 ring-gray-300'
                  : 'bg-casino-bg text-gray-400 hover:text-white border border-casino-border'
              }`}
            >
              <div className="text-3xl mb-1">T</div>
              <div className="text-xs uppercase">Tails</div>
            </button>
          </div>
        </div>

        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onBet={flip}
          balance={balance}
          disabled={isFlipping}
          buttonText={isFlipping ? 'FLIPPING...' : 'FLIP COIN'}
          showAutoBet={false}
        />

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase">Win Multiplier</span>
            <span className="text-lg font-bold text-casino-green">1.98x</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 uppercase">Win Chance</span>
            <span className="text-lg font-bold text-casino-cyan">50%</span>
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Pick heads or tails and flip the coin. Win 1.98x your bet if you guess correctly. It's a classic 50/50 chance!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoinFlipGame;
