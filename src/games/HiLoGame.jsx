import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardNumericValue = (value) => {
  if (value === 'A') return 14;
  if (value === 'K') return 13;
  if (value === 'Q') return 12;
  if (value === 'J') return 11;
  return parseInt(value);
};

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, numericValue: getCardNumericValue(value) });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const Card = ({ card, size = 'normal' }) => {
  const isRed = ['♥', '♦'].includes(card?.suit);
  const sizeClasses = size === 'large' ? 'w-24 h-36 text-2xl' : 'w-16 h-24 text-lg';

  return (
    <div className={`${sizeClasses} rounded-lg bg-white border-2 border-gray-300 flex flex-col items-center justify-center ${isRed ? 'text-red-600' : 'text-black'}`}>
      <span className="font-bold">{card.value}</span>
      <span className="text-xl">{card.suit}</span>
    </div>
  );
};

export default function HiLoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [gameState, setGameState] = useState('betting'); // betting, playing, finished
  const [result, setResult] = useState(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [history, setHistory] = useState([]);
  const [potentialWin, setPotentialWin] = useState(0);

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'hilo')) return;

    const newDeck = createDeck();
    const firstCard = newDeck.pop();

    setDeck(newDeck);
    setCurrentCard(firstCard);
    setGameState('playing');
    setResult(null);
    setStreak(0);
    setMultiplier(1);
    setPotentialWin(bet);
  }, [bet, state.balance, placeBet]);

  const calculateOdds = (card, guess) => {
    // Calculate probability of winning based on card value
    const value = card.numericValue;

    if (guess === 'higher') {
      // Cards higher than current: 14 - value cards × 4 suits
      const higherCards = (14 - value) * 4;
      return higherCards / 51; // 51 remaining cards
    } else {
      // Cards lower than current: (value - 2) cards × 4 suits
      const lowerCards = (value - 2) * 4;
      return lowerCards / 51;
    }
  };

  const guess = useCallback((choice) => {
    if (gameState !== 'playing' || deck.length === 0) return;

    const newDeck = [...deck];
    const nextCard = newDeck.pop();
    const currentValue = currentCard.numericValue;
    const nextValue = nextCard.numericValue;

    let won = false;
    if (choice === 'higher') {
      won = nextValue > currentValue;
    } else if (choice === 'lower') {
      won = nextValue < currentValue;
    } else if (choice === 'same') {
      won = nextValue === currentValue;
    }

    // Calculate new multiplier based on odds
    const odds = choice === 'same' ? 0.06 : calculateOdds(currentCard, choice);
    const guessMultiplier = choice === 'same' ? 12 : Math.max(1.1, 1 / odds).toFixed(2);

    if (won) {
      const newStreak = streak + 1;
      const newMultiplier = multiplier * parseFloat(guessMultiplier);

      setStreak(newStreak);
      setMultiplier(newMultiplier);
      setCurrentCard(nextCard);
      setDeck(newDeck);
      setPotentialWin(bet * newMultiplier);

      setResult({
        won: true,
        text: choice === 'same' ? 'SAME!' : choice === 'higher' ? 'HIGHER!' : 'LOWER!',
        card: nextCard
      });
    } else {
      // Lost
      addWin(0, bet, 'hilo', 0);
      setGameState('finished');
      setResult({
        won: false,
        text: 'WRONG!',
        card: nextCard
      });
      setHistory(h => [{ won: false, streak }, ...h.slice(0, 9)]);
    }
  }, [gameState, deck, currentCard, streak, multiplier, bet, addWin]);

  const cashout = useCallback(() => {
    if (gameState !== 'playing') return;

    const winAmount = bet * multiplier;
    addWin(winAmount, bet, 'hilo', multiplier);

    setGameState('finished');
    setResult({
      won: true,
      text: 'CASHED OUT!',
      cashout: true
    });
    setHistory(h => [{ won: true, streak, multiplier }, ...h.slice(0, 9)]);
  }, [gameState, bet, multiplier, streak, addWin]);

  const newGame = () => {
    setGameState('betting');
    setCurrentCard(null);
    setResult(null);
    setStreak(0);
    setMultiplier(1);
  };

  const getHigherOdds = () => {
    if (!currentCard) return '0.00';
    return (calculateOdds(currentCard, 'higher') * 100).toFixed(0);
  };

  const getLowerOdds = () => {
    if (!currentCard) return '0.00';
    return (calculateOdds(currentCard, 'lower') * 100).toFixed(0);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Area */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Higher or Lower?</h2>
          <p className="text-gray-400 text-sm">Guess if the next card is higher or lower</p>
        </div>

        {/* Current Card */}
        <div className="flex justify-center mb-8">
          {currentCard ? (
            <div className="relative">
              <Card card={currentCard} size="large" />
              {result && result.card && (
                <div className="absolute -right-20 top-0">
                  <div className={`transform transition-all ${result.won ? 'scale-100' : 'scale-100'}`}>
                    <Card card={result.card} size="large" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-36 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 flex items-center justify-center">
              <span className="text-4xl">🂠</span>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center mb-6 text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
            {result.text}
          </div>
        )}

        {/* Game Stats */}
        {gameState === 'playing' && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0a0a14] rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase">Streak</div>
              <div className="text-2xl font-bold text-white">{streak}</div>
            </div>
            <div className="bg-[#0a0a14] rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase">Multiplier</div>
              <div className="text-2xl font-bold text-cyan-400">{multiplier.toFixed(2)}×</div>
            </div>
            <div className="bg-[#0a0a14] rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase">Potential Win</div>
              <div className="text-2xl font-bold text-green-400">${potentialWin.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {gameState === 'playing' && (
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => guess('higher')}
              className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:brightness-110 transition flex flex-col items-center"
            >
              <span className="text-2xl">⬆️</span>
              <span>HIGHER</span>
              <span className="text-xs opacity-75">{getHigherOdds()}% chance</span>
            </button>
            <button
              onClick={() => guess('same')}
              className="px-8 py-4 bg-yellow-500 text-white rounded-xl font-bold hover:brightness-110 transition flex flex-col items-center"
            >
              <span className="text-2xl">🟰</span>
              <span>SAME</span>
              <span className="text-xs opacity-75">~6% chance</span>
            </button>
            <button
              onClick={() => guess('lower')}
              className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold hover:brightness-110 transition flex flex-col items-center"
            >
              <span className="text-2xl">⬇️</span>
              <span>LOWER</span>
              <span className="text-xs opacity-75">{getLowerOdds()}% chance</span>
            </button>
          </div>
        )}

        {/* Cashout Button */}
        {gameState === 'playing' && streak > 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={cashout}
              className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:brightness-110 transition text-xl"
            >
              💰 CASHOUT ${potentialWin.toFixed(2)}
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'finished' && (
          <div className="flex justify-center">
            <button
              onClick={newGame}
              className="px-8 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:brightness-110 transition"
            >
              NEW GAME
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Games</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.won ? `${h.streak}🔥 ${h.multiplier?.toFixed(2)}×` : `${h.streak}🔥`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div>
        {gameState === 'betting' ? (
          <BetControls
            bet={bet}
            setBet={setBet}
            onPlay={startGame}
            disabled={gameState !== 'betting'}
            balance={state.balance}
            buttonText="START"
          />
        ) : (
          <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Current Bet</div>
              <div className="text-2xl font-bold text-white">${bet.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Cards Left</div>
              <div className="text-xl font-bold text-gray-400">{deck.length}</div>
            </div>
          </div>
        )}

        {/* Card Reference */}
        <div className="mt-4 bg-[#1a1a2e] rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">Card Order</h3>
          <div className="text-xs text-gray-400 text-center">
            A &gt; K &gt; Q &gt; J &gt; 10 &gt; 9 &gt; 8 &gt; 7 &gt; 6 &gt; 5 &gt; 4 &gt; 3 &gt; 2
          </div>
        </div>
      </div>
    </div>
  );
}
