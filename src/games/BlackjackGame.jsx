import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardScore = v => v === 'A' ? 11 : ['K', 'Q', 'J'].includes(v) ? 10 : parseInt(v);
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

const Card = ({ card, hidden = false }) => {
  if (hidden) {
    return (
      <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-600 flex items-center justify-center shadow-xl">
        <span className="text-3xl">🎴</span>
      </div>
    );
  }

  const red = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div className="w-20 h-28 rounded-xl bg-white border-2 border-gray-200 flex flex-col justify-between p-2 shadow-xl">
      <div className={`flex items-center gap-0.5 ${red ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold text-lg">{card.value}</span>
        <SuitIcon suit={card.suit} size={14} />
      </div>
      <div className="flex justify-center">
        <SuitIcon suit={card.suit} size={32} />
      </div>
      <div className={`flex items-center gap-0.5 rotate-180 ${red ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold text-lg">{card.value}</span>
        <SuitIcon suit={card.suit} size={14} />
      </div>
    </div>
  );
};

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, score: getCardScore(value) });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = hand => {
  let score = 0, aces = 0;
  for (const card of hand) {
    if (!card) continue;
    score += card.score;
    if (card.value === 'A') aces++;
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
};

export default function BlackjackGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [phase, setPhase] = useState('betting');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const deal = useCallback(() => {
    if (phase !== 'betting' || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setRevealed(false);
    setResult(null);
    setPhase('playing');
    audio.playBet();

    // Check for blackjack
    if (calculateScore(pHand) === 21) {
      setTimeout(() => finishGame(pHand, dHand, newDeck), 500);
    }
  }, [bet, phase, state.balance, placeBet]);

  const hit = () => {
    if (phase !== 'playing' || deck.length === 0) return;

    const newCard = deck.pop();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]);
    audio.playTick();

    const score = calculateScore(newHand);
    if (score > 21) {
      finishGame(newHand, dealerHand, deck);
    } else if (score === 21) {
      stand(newHand);
    }
  };

  const stand = (pHand = playerHand) => {
    if (phase !== 'playing') return;
    setPhase('dealer');
    setRevealed(true);

    // Dealer draws
    let dHand = [...dealerHand];
    let dDeck = [...deck];

    const dealerDraw = () => {
      if (calculateScore(dHand) < 17 && dDeck.length > 0) {
        setTimeout(() => {
          dHand = [...dHand, dDeck.pop()];
          setDealerHand(dHand);
          setDeck([...dDeck]);
          audio.playTick();
          dealerDraw();
        }, 500);
      } else {
        setTimeout(() => finishGame(pHand, dHand, dDeck), 300);
      }
    };

    dealerDraw();
  };

  const finishGame = (pHand, dHand, finalDeck) => {
    setRevealed(true);
    setPhase('finished');

    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    let type = '', mult = 0, win = 0;

    if (pScore > 21) {
      type = 'BUST';
    } else if (dScore > 21) {
      type = 'DEALER BUST'; mult = 2; win = bet * 2;
    } else if (pScore === 21 && pHand.length === 2 && !(dScore === 21 && dHand.length === 2)) {
      type = 'BLACKJACK!'; mult = 2.5; win = bet * 2.5;
    } else if (dScore === 21 && dHand.length === 2) {
      type = 'DEALER BJ';
    } else if (pScore > dScore) {
      type = 'WIN'; mult = 2; win = bet * 2;
    } else if (pScore < dScore) {
      type = 'LOSE';
    } else {
      type = 'PUSH'; mult = 1; win = bet;
    }

    if (win > 0) {
      addWin(win, bet, 'blackjack', mult);
      type === 'PUSH' ? audio.playTick() : audio.playWin();
    } else {
      addWin(0, bet, 'blackjack', 0);
      audio.playLose();
    }

    setResult({ type, pScore, dScore, profit: win - bet });
    setHistory(h => [{ type, pScore, dScore }, ...h.slice(0, 9)]);
  };

  const newGame = () => {
    setPhase('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
    setRevealed(false);
  };

  const pScore = calculateScore(playerHand);
  const dScore = revealed ? calculateScore(dealerHand) : (dealerHand[0] ? dealerHand[0].score : 0);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Dealer */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">DEALER</span>
            <span className="text-xl font-bold">{revealed ? dScore : (dealerHand[0] ? `${dealerHand[0].score} + ?` : '-')}</span>
          </div>
          <div className="flex gap-3 justify-center min-h-32">
            {dealerHand.map((card, i) => (
              <Card key={i} card={card} hidden={i === 1 && !revealed} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mb-6">
            <div className={`text-4xl font-black ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.type}
            </div>
            <div className={`text-xl ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}
            </div>
          </div>
        )}

        {/* Player */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">YOUR HAND</span>
            <span className={`text-xl font-bold ${pScore > 21 ? 'text-red-400' : pScore === 21 ? 'text-green-400' : ''}`}>
              {pScore || '-'}
            </span>
          </div>
          <div className="flex gap-3 justify-center min-h-32">
            {playerHand.map((card, i) => (
              <Card key={i} card={card} />
            ))}
          </div>
        </div>

        {/* Actions */}
        {phase === 'playing' && (
          <div className="flex gap-4 justify-center">
            <button onClick={hit} className="btn-primary bg-cyan-600 hover:bg-cyan-700 px-8 py-3 font-bold text-lg">
              HIT
            </button>
            <button onClick={() => stand()} className="btn-primary bg-yellow-600 hover:bg-yellow-700 px-8 py-3 font-bold text-lg">
              STAND
            </button>
          </div>
        )}

        {phase === 'finished' && (
          <div className="flex justify-center">
            <button onClick={newGame} className="btn-primary px-8 py-3 font-bold text-lg">NEW GAME</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {phase === 'betting' ? (
          <BetControls bet={bet} setBet={setBet} onPlay={deal} buttonText="DEAL" />
        ) : (
          <div className="game-card p-4 text-center">
            <div className="text-gray-400 text-sm">Current Bet</div>
            <div className="text-3xl font-black text-cyan-400">${bet.toFixed(2)}</div>
          </div>
        )}

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${
                  h.type.includes('WIN') || h.type.includes('BLACKJACK') || h.type.includes('DEALER BUST')
                    ? 'text-green-400' : h.type === 'PUSH' ? 'text-gray-400' : 'text-red-400'
                }`}>
                  <span>{h.type}</span>
                  <span>{h.pScore} vs {h.dScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Payouts</div>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Blackjack: 2.5x</li>
            <li>• Win: 2x</li>
            <li>• Push: 1x</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
