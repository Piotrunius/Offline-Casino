import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Equal } from 'lucide-react';
import { useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

const getRandomCard = () => CARDS[Math.floor(Math.random() * CARDS.length)];

const HiLoGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [currentCard, setCurrentCard] = useState(getRandomCard());
  const [nextCard, setNextCard] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const multiplier = Math.pow(1.9, streak).toFixed(2);
  const potentialWin = (betAmount * parseFloat(multiplier)).toFixed(2);

  const startGame = () => {
    if (betAmount > balance) return;
    subtractBalance(betAmount);
    setCurrentCard(getRandomCard());
    setNextCard(null);
    setPlaying(true);
    setStreak(0);
    setResult(null);
    if (soundEnabled) playSound('betPlace');
  };

  const guess = (guessType) => {
    if (!playing) return;

    const next = getRandomCard();
    setNextCard(next);
    if (soundEnabled) playSound('cardFlip');

    const currentValue = CARD_VALUES[currentCard];
    const nextValue = CARD_VALUES[next];

    let won = false;
    if (guessType === 'higher') {
      won = nextValue > currentValue;
    } else if (guessType === 'lower') {
      won = nextValue < currentValue;
    } else {
      won = nextValue === currentValue;
    }

    setTimeout(() => {
      if (won) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setCurrentCard(next);
        setNextCard(null);
        if (soundEnabled) playSound('betWin');
      } else {
        // Game over
        setResult({ won: false, streak });
        setHistory(prev => [{ streak, won: false }, ...prev.slice(0, 14)]);
        setPlaying(false);
        if (soundEnabled) playSound('betLose');
      }
    }, 500);
  };

  const cashOut = () => {
    if (!playing || streak === 0) return;
    const winAmount = betAmount * parseFloat(multiplier);
    addBalance(winAmount);
    setResult({ won: true, streak, amount: winAmount });
    setHistory(prev => [{ streak, won: true }, ...prev.slice(0, 14)]);
    setPlaying(false);
    if (soundEnabled) {
      if (streak >= 5) playSound('bigWin');
      else playSound('betWin');
    }
  };

  const Card = ({ value, hidden }) => (
    <div className={`w-24 h-36 sm:w-32 sm:h-44 rounded-xl border-2 flex items-center justify-center text-4xl sm:text-5xl font-black ${
      hidden ? 'bg-casino-card border-casino-border text-gray-600' : 'bg-white border-white text-casino-bg'
    }`}>
      {hidden ? '?' : value}
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Cards */}
        <div className="flex items-center gap-8">
          <Card value={currentCard} />
          <motion.div
            initial={{ rotateY: 180 }}
            animate={{ rotateY: nextCard ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <Card value={nextCard || '?'} hidden={!nextCard} />
          </motion.div>
        </div>

        {/* Guess buttons */}
        {playing && !nextCard && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => guess('higher')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-casino-green text-white font-bold hover:brightness-110 transition"
            >
              <ArrowUp className="w-5 h-5" />
              Higher
            </button>
            <button
              onClick={() => guess('same')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-casino-gold text-casino-bg font-bold hover:brightness-110 transition"
            >
              <Equal className="w-5 h-5" />
              Same
            </button>
            <button
              onClick={() => guess('lower')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-casino-red text-white font-bold hover:brightness-110 transition"
            >
              <ArrowDown className="w-5 h-5" />
              Lower
            </button>
          </div>
        )}

        {/* Result */}
        <div className="h-20 flex items-center justify-center mt-4">
          {result && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-black ${result.won ? 'text-casino-green' : 'text-casino-red'}`}
            >
              {result.won ? `WIN! +$${(result.amount - betAmount).toFixed(2)}` : `LOST - Streak: ${result.streak}`}
            </motion.div>
          )}
        </div>

        {/* History */}
        <div className="flex gap-2 overflow-x-auto pb-2 max-h-12">
          {history.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold ${h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}`}
            >
              {h.streak}🔥
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {playing ? (
          <>
            <div className="bg-casino-card border border-casino-border rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase">Current Streak</div>
              <div className="text-4xl font-black text-casino-gold">{streak}🔥</div>
              <div className="text-sm text-gray-400 mt-1">Multiplier: {multiplier}x</div>
            </div>
            <button
              onClick={cashOut}
              disabled={streak === 0}
              className="w-full py-4 rounded-xl bg-casino-green text-white font-black text-lg hover:brightness-110 transition disabled:opacity-50"
            >
              CASH OUT ${potentialWin}
            </button>
          </>
        ) : (
          <BetControls
            betAmount={betAmount}
            onBetChange={setBetAmount}
            onBet={startGame}
            balance={balance}
            disabled={playing}
            buttonText="START GAME"
            showAutoBet={false}
          />
        )}

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">How to Play</h3>
          <p className="text-sm text-gray-500">
            Guess if the next card will be higher, lower, or the same.
            Each correct guess increases your streak and multiplier.
            Cash out anytime or risk it for bigger wins!
          </p>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Multipliers</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className="flex justify-between text-gray-400">
                <span>{s} streak</span>
                <span className="text-casino-cyan">{Math.pow(1.9, s).toFixed(2)}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiLoGame;
