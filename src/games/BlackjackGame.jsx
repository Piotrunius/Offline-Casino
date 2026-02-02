import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getCardValue = (card) => {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
};

const calculateHand = (hand) => {
  let total = hand.reduce((sum, card) => sum + getCardValue(card), 0);
  let aces = hand.filter(card => card.value === 'A').length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

const Card = ({ card, hidden = false }) => {
  const isRed = ['♥', '♦'].includes(card?.suit);

  if (hidden) {
    return (
      <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 flex items-center justify-center">
        <span className="text-2xl">🂠</span>
      </div>
    );
  }

  return (
    <div className={`w-16 h-24 rounded-lg bg-white border-2 border-gray-300 flex flex-col items-center justify-center ${isRed ? 'text-red-600' : 'text-black'}`}>
      <span className="text-lg font-bold">{card.value}</span>
      <span className="text-xl">{card.suit}</span>
    </div>
  );
};

export default function BlackjackGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // betting, playing, dealerTurn, finished
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);

  const deal = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setResult(null);

    // Check for blackjack
    const pTotal = calculateHand(pHand);
    if (pTotal === 21) {
      setTimeout(() => finishGame(newDeck, pHand, dHand), 500);
    }
  }, [bet, state.balance, placeBet]);

  const hit = useCallback(() => {
    if (gameState !== 'playing') return;

    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const total = calculateHand(newHand);
    if (total >= 21) {
      setTimeout(() => finishGame(newDeck, newHand, dealerHand), 500);
    }
  }, [gameState, deck, playerHand, dealerHand]);

  const stand = useCallback(() => {
    if (gameState !== 'playing') return;
    setGameState('dealerTurn');

    // Dealer draws
    let newDeck = [...deck];
    let newDealerHand = [...dealerHand];

    const dealerDraw = () => {
      const total = calculateHand(newDealerHand);
      if (total < 17) {
        newDealerHand = [...newDealerHand, newDeck.pop()];
        setDealerHand(newDealerHand);
        setDeck(newDeck);
        setTimeout(dealerDraw, 500);
      } else {
        finishGame(newDeck, playerHand, newDealerHand);
      }
    };

    setTimeout(dealerDraw, 500);
  }, [gameState, deck, playerHand, dealerHand]);

  const finishGame = (finalDeck, pHand, dHand) => {
    const pTotal = calculateHand(pHand);
    const dTotal = calculateHand(dHand);

    let resultText = '';
    let won = false;
    let multiplier = 0;

    if (pTotal > 21) {
      resultText = 'BUST!';
      won = false;
    } else if (dTotal > 21) {
      resultText = 'DEALER BUST!';
      won = true;
      multiplier = 2;
    } else if (pTotal === 21 && pHand.length === 2 && !(dTotal === 21 && dHand.length === 2)) {
      resultText = 'BLACKJACK!';
      won = true;
      multiplier = 2.5;
    } else if (pTotal > dTotal) {
      resultText = 'WIN!';
      won = true;
      multiplier = 2;
    } else if (pTotal < dTotal) {
      resultText = 'LOSE!';
      won = false;
    } else {
      resultText = 'PUSH';
      multiplier = 1; // Return bet
    }

    const winAmount = bet * multiplier;
    if (multiplier > 0) {
      addWin(winAmount, bet, 'blackjack', multiplier);
    } else {
      addWin(0, bet, 'blackjack', 0);
    }

    setResult({ text: resultText, won, profit: (winAmount - bet).toFixed(2) });
    setGameState('finished');
    setHistory(h => [{ won, pTotal, dTotal }, ...h.slice(0, 9)]);
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Table */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-8">
        {/* Dealer Hand */}
        <div className="mb-8">
          <div className="text-xs text-gray-500 uppercase mb-2">
            Dealer {gameState !== 'playing' && dealerHand.length > 0 && `(${dealerTotal})`}
          </div>
          <div className="flex gap-2">
            {dealerHand.map((card, i) => (
              <Card key={i} card={card} hidden={i === 1 && gameState === 'playing'} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center my-8">
            <div className={`text-4xl font-black mb-2 ${result.won ? 'text-green-400' : result.text === 'PUSH' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.text}
            </div>
            <div className={`text-2xl font-bold ${parseFloat(result.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(result.profit) >= 0 ? '+' : ''}{result.profit}
            </div>
          </div>
        )}

        {/* Player Hand */}
        <div className="mb-8">
          <div className="text-xs text-gray-500 uppercase mb-2">
            Your Hand {playerHand.length > 0 && `(${playerTotal})`}
          </div>
          <div className="flex gap-2">
            {playerHand.map((card, i) => (
              <Card key={i} card={card} />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {gameState === 'playing' && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={hit}
              className="px-8 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:brightness-110 transition"
            >
              HIT
            </button>
            <button
              onClick={stand}
              className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:brightness-110 transition"
            >
              STAND
            </button>
          </div>
        )}

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
                  {h.pTotal} vs {h.dTotal}
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
            onPlay={deal}
            disabled={gameState !== 'betting'}
            balance={state.balance}
            buttonText="DEAL"
          />
        ) : (
          <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Current Bet</div>
              <div className="text-2xl font-bold text-white">${bet.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Your Total</div>
              <div className="text-3xl font-black text-cyan-400">{playerTotal}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
