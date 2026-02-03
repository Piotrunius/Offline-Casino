import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getNumericValue = v => v === 'A' ? 14 : v === 'K' ? 13 : v === 'Q' ? 12 : v === 'J' ? 11 : parseInt(v);

const SuitIcon = ({ suit, size = 24 }) => {
  const red = suit === 'hearts' || suit === 'diamonds';
  const color = red ? '#ef4444' : '#1f2937';

  const paths = {
    hearts: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    diamonds: 'M12 2L2 12l10 10 10-10L12 2z',
    clubs: 'M12 2c-2 0-3.5 1.5-3.5 3.5 0 1 .4 1.9 1 2.5-1.5.5-2.5 2-2.5 3.5 0 2 1.5 3.5 3.5 3.5.5 0 1-.1 1.5-.3V17H9v2h6v-2h-3v-2.3c.5.2 1 .3 1.5.3 2 0 3.5-1.5 3.5-3.5 0-1.5-1-3-2.5-3.5.6-.6 1-1.5 1-2.5C15.5 3.5 14 2 12 2z',
    spades: 'M12 2L4 12c0 3 2 5 4 5 1 0 2-.5 3-1.5V18H9v2h6v-2h-2v-2.5c1 1 2 1.5 3 1.5 2 0 4-2 4-5L12 2z'
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={paths[suit]} />
    </svg>
  );
};

const Card = ({ card, flipping = false }) => {
  const red = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div className={`w-32 h-44 rounded-xl bg-white border-2 border-gray-200 flex flex-col justify-between p-3 shadow-2xl transition-transform ${flipping ? 'animate-flip' : ''}`}>
      <div className={`flex items-center gap-1 ${red ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold text-xl">{card.value}</span>
        <SuitIcon suit={card.suit} size={18} />
      </div>
      <div className="flex justify-center">
        <SuitIcon suit={card.suit} size={50} />
      </div>
      <div className={`flex items-center gap-1 rotate-180 ${red ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold text-xl">{card.value}</span>
        <SuitIcon suit={card.suit} size={18} />
      </div>
    </div>
  );
};

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// Bet types with multipliers based on probability
const BET_TYPES = {
  higher: { label: 'HIGHER', getMult: (v) => Math.max(1.1, (14 / (14 - v + 1)).toFixed(2)) },
  lower: { label: 'LOWER', getMult: (v) => Math.max(1.1, (14 / (v - 1 || 1)).toFixed(2)) },
  same: { label: 'SAME', getMult: () => 12 },
  red: { label: 'RED ♥♦', getMult: () => 2, check: c => c.suit === 'hearts' || c.suit === 'diamonds' },
  black: { label: 'BLACK ♠♣', getMult: () => 2, check: c => c.suit === 'clubs' || c.suit === 'spades' },
  hearts: { label: '♥ HEARTS', getMult: () => 4, check: c => c.suit === 'hearts' },
  diamonds: { label: '♦ DIAMONDS', getMult: () => 4, check: c => c.suit === 'diamonds' },
  clubs: { label: '♣ CLUBS', getMult: () => 4, check: c => c.suit === 'clubs' },
  spades: { label: '♠ SPADES', getMult: () => 4, check: c => c.suit === 'spades' },
  face: { label: 'FACE (J/Q/K)', getMult: () => 4.3, check: c => ['J', 'Q', 'K'].includes(c.value) },
  ace: { label: 'ACE', getMult: () => 13, check: c => c.value === 'A' },
  odd: { label: 'ODD', getMult: () => 2.1, check: c => !['A', 'J', 'Q', 'K'].includes(c.value) && parseInt(c.value) % 2 === 1 },
  even: { label: 'EVEN', getMult: () => 2.1, check: c => !['A', 'J', 'Q', 'K'].includes(c.value) && parseInt(c.value) % 2 === 0 },
};

export default function HiLoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [nextCard, setNextCard] = useState(null);
  const [phase, setPhase] = useState('betting'); // betting, playing, revealing, finished
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [revealing, setRevealing] = useState(false);

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'hilo')) return;

    const newDeck = createDeck();
    const first = newDeck.pop();

    setDeck(newDeck);
    setCurrentCard(first);
    setNextCard(null);
    setPhase('playing');
    setStreak(0);
    setMultiplier(1);
    setResult(null);
    setRevealing(false);
    audio.playBet();
  }, [bet, state.balance, placeBet]);

  const guess = (betType) => {
    if (phase !== 'playing' || deck.length === 0) return;

    setRevealing(true);
    const newDeck = [...deck];
    const drawn = newDeck.pop();
    setNextCard(drawn);
    setDeck(newDeck);
    audio.playTick();

    setTimeout(() => {
      const currentValue = getNumericValue(currentCard.value);
      const nextValue = getNumericValue(drawn.value);
      const betInfo = BET_TYPES[betType];

      let won = false;

      // Check win based on bet type
      if (betType === 'higher') {
        won = nextValue > currentValue;
      } else if (betType === 'lower') {
        won = nextValue < currentValue;
      } else if (betType === 'same') {
        won = nextValue === currentValue;
      } else if (betInfo.check) {
        won = betInfo.check(drawn);
      }

      setRevealing(false);

      if (won) {
        const betMult = parseFloat(betInfo.getMult(currentValue));
        const newMult = multiplier * betMult;
        setStreak(streak + 1);
        setMultiplier(newMult);
        setCurrentCard(drawn);
        setNextCard(null);
        audio.playTick();

        if (newDeck.length === 0) {
          cashOut(newMult);
        }
      } else {
        setPhase('finished');
        addWin(0, bet, 'hilo', 0);
        audio.playLose();
        setResult({ won: false, streak, profit: -bet });
        setHistory(h => [{ won: false, streak }, ...h.slice(0, 9)]);
      }
    }, state.settings.fastMode ? 300 : 600);
  };

  const cashOut = (mult = multiplier) => {
    if (phase !== 'playing' || streak === 0) return;

    const win = bet * mult;
    addWin(win, bet, 'hilo', mult);
    audio.playCashout();
    setPhase('finished');
    setResult({ won: true, streak, multiplier: mult, profit: win - bet });
    setHistory(h => [{ won: true, streak }, ...h.slice(0, 9)]);
  };

  const newGame = () => {
    setPhase('betting');
    setCurrentCard(null);
    setNextCard(null);
    setResult(null);
    setStreak(0);
    setMultiplier(1);
  };

  const currentValue = currentCard ? getNumericValue(currentCard.value) : 0;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-gray-400 text-sm">Streak</div>
            <div className="text-3xl font-black text-cyan-400">{streak}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Multiplier</div>
            <div className="text-3xl font-black text-green-400">{multiplier.toFixed(2)}x</div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex justify-center items-center gap-8 mb-8 min-h-52">
          {currentCard && <Card card={currentCard} />}
          {revealing && nextCard && <Card card={nextCard} flipping />}
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-6">
            <div className={`text-4xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WON ${result.multiplier.toFixed(2)}x!` : 'LOST!'}
            </div>
            <div className={`text-xl ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}
            </div>
          </div>
        )}

        {/* Betting options */}
        {phase === 'playing' && !revealing && (
          <div className="space-y-4">
            {/* Main bets: Higher/Lower/Same */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => guess('higher')}
                className="py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-all">
                <div>HIGHER ↑</div>
                <div className="text-sm opacity-80">{BET_TYPES.higher.getMult(currentValue)}x</div>
              </button>
              <button onClick={() => guess('same')}
                className="py-4 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg transition-all">
                <div>SAME =</div>
                <div className="text-sm opacity-80">{BET_TYPES.same.getMult()}x</div>
              </button>
              <button onClick={() => guess('lower')}
                className="py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition-all">
                <div>LOWER ↓</div>
                <div className="text-sm opacity-80">{BET_TYPES.lower.getMult(currentValue)}x</div>
              </button>
            </div>

            {/* Color bets */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => guess('red')}
                className="py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-all">
                RED ♥♦ (2x)
              </button>
              <button onClick={() => guess('black')}
                className="py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all border border-gray-600">
                BLACK ♠♣ (2x)
              </button>
            </div>

            {/* Suit bets */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => guess('hearts')}
                className="py-2 rounded-lg bg-red-700/50 hover:bg-red-600/50 text-white text-sm font-bold">
                ♥ 4x
              </button>
              <button onClick={() => guess('diamonds')}
                className="py-2 rounded-lg bg-red-700/50 hover:bg-red-600/50 text-white text-sm font-bold">
                ♦ 4x
              </button>
              <button onClick={() => guess('clubs')}
                className="py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-white text-sm font-bold">
                ♣ 4x
              </button>
              <button onClick={() => guess('spades')}
                className="py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-white text-sm font-bold">
                ♠ 4x
              </button>
            </div>

            {/* Special bets */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => guess('face')}
                className="py-2 rounded-lg bg-purple-700/50 hover:bg-purple-600/50 text-white text-sm font-bold">
                FACE 4.3x
              </button>
              <button onClick={() => guess('ace')}
                className="py-2 rounded-lg bg-yellow-700/50 hover:bg-yellow-600/50 text-white text-sm font-bold">
                ACE 13x
              </button>
              <button onClick={() => guess('odd')}
                className="py-2 rounded-lg bg-cyan-700/50 hover:bg-cyan-600/50 text-white text-sm font-bold">
                ODD 2.1x
              </button>
              <button onClick={() => guess('even')}
                className="py-2 rounded-lg bg-cyan-700/50 hover:bg-cyan-600/50 text-white text-sm font-bold">
                EVEN 2.1x
              </button>
            </div>

            {/* Cashout */}
            {streak > 0 && (
              <button onClick={() => cashOut()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-xl">
                CASHOUT ${(bet * multiplier).toFixed(2)}
              </button>
            )}
          </div>
        )}

        {phase === 'finished' && (
          <div className="flex justify-center">
            <button onClick={newGame} className="btn-primary px-8 py-3 font-bold text-lg">
              NEW GAME
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {phase === 'betting' ? (
          <BetControls bet={bet} setBet={setBet} onPlay={start} buttonText="START" />
        ) : (
          <div className="game-card p-4 text-center">
            <div className="text-gray-400 text-sm">Current Bet</div>
            <div className="text-3xl font-black text-cyan-400">${bet.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Potential: ${(bet * multiplier).toFixed(2)}</div>
          </div>
        )}

        {/* Cards remaining */}
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-sm">Cards Left</div>
          <div className="text-2xl font-bold text-white">{deck.length}</div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{h.won ? 'WIN' : 'LOST'}</span>
                  <span>Streak: {h.streak}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flip {
          0% { transform: rotateY(-90deg) scale(0.8); }
          100% { transform: rotateY(0) scale(1); }
        }
        .animate-flip { animation: flip 0.4s ease-out; }
      `}</style>
    </div>
  );
}
