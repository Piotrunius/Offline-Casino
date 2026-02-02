import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SuitIcon = ({ suit, className = "w-4 h-4" }) => {
  const colors = {
    hearts: 'text-red-500',
    diamonds: 'text-red-500',
    clubs: 'text-gray-800',
    spades: 'text-gray-800'
  };

  const paths = {
    hearts: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    diamonds: "M12 2L2 12l10 10 10-10L12 2z",
    clubs: "M12 2C9.79 2 8 3.79 8 6c0 1.48.81 2.77 2 3.45V11H8c-2.21 0-4 1.79-4 4s1.79 4 4 4h1v1c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-1h1c2.21 0 4-1.79 4-4s-1.79-4-4-4h-2V9.45c1.19-.68 2-1.97 2-3.45 0-2.21-1.79-4-4-4z",
    spades: "M12 2L4 12c0 2.21 1.79 4 4 4h1v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h1c2.21 0 4-1.79 4-4L12 2z"
  };

  return (
    <svg className={`${className} ${colors[suit]}`} viewBox="0 0 24 24" fill="currentColor">
      <path d={paths[suit]} />
    </svg>
  );
};

const Card = ({ card, hidden = false, small = false }) => {
  const sizeClasses = small
    ? 'w-12 h-16 text-xs'
    : 'w-16 h-24 md:w-20 md:h-28 text-sm md:text-base';

  if (hidden) {
    return (
      <div className={`${sizeClasses} rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-500 flex items-center justify-center`}>
        <div className="text-blue-300 text-2xl font-bold">?</div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div className={`${sizeClasses} rounded-lg bg-white border-2 border-gray-200 flex flex-col p-1 shadow-lg`}>
      <div className={`flex items-center gap-0.5 ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold">{card.value}</span>
        <SuitIcon suit={card.suit} className="w-3 h-3" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <SuitIcon suit={card.suit} className={small ? 'w-6 h-6' : 'w-8 h-8 md:w-10 md:h-10'} />
      </div>
      <div className={`flex items-center justify-end gap-0.5 rotate-180 ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        <span className="font-bold">{card.value}</span>
        <SuitIcon suit={card.suit} className="w-3 h-3" />
      </div>
    </div>
  );
};

const getCardValue = (card) => {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
};

const calculateHand = (cards) => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const value = getCardValue(card);
    if (card.value === 'A') aces++;
    total += value;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const BlackjackGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gamePhase, setGamePhase] = useState('betting'); // betting, insurance, playing, dealer, result
  const [result, setResult] = useState(null);
  const [showDealerCard, setShowDealerCard] = useState(false);
  const [history, setHistory] = useState([]);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [insuranceOffered, setInsuranceOffered] = useState(false);

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);

  const deal = useCallback(() => {
    if (betAmount > balance) return;

    subtractBalance(betAmount);
    if (soundEnabled) playSound('cardDeal');

    const newDeck = createDeck();
    const pCards = [newDeck.pop(), newDeck.pop()];
    const dCards = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(pCards);
    setDealerHand(dCards);
    setShowDealerCard(false);
    setResult(null);
    setInsuranceBet(0);
    setInsuranceOffered(false);

    // Check for blackjack
    const pTotal = calculateHand(pCards);
    const dTotal = calculateHand(dCards);

    if (pTotal === 21) {
      setShowDealerCard(true);
      if (soundEnabled) playSound('blackjack');
      if (dTotal === 21) {
        // Push
        setResult({ type: 'push', message: 'Push - Both Blackjack' });
        addBalance(betAmount);
        setHistory(prev => [{ result: 'push', playerTotal: 21, dealerTotal: 21 }, ...prev.slice(0, 9)]);
      } else {
        // Player blackjack - pays 3:2
        const winAmount = betAmount * 2.5;
        setResult({ type: 'blackjack', message: 'Blackjack!', amount: winAmount });
        addBalance(winAmount);
        setHistory(prev => [{ result: 'win', playerTotal: 21, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
      }
      setGamePhase('result');
    } else if (dCards[0].value === 'A') {
      // Dealer shows Ace - offer insurance
      setInsuranceOffered(true);
      setGamePhase('insurance');
    } else {
      setGamePhase('playing');
    }
  }, [betAmount, balance, subtractBalance, addBalance, soundEnabled]);

  const hit = useCallback(() => {
    if (gamePhase !== 'playing') return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];
    if (soundEnabled) playSound('cardDeal');

    setDeck(newDeck);
    setPlayerHand(newHand);

    const total = calculateHand(newHand);
    if (total > 21) {
      setShowDealerCard(true);
      setResult({ type: 'bust', message: 'Bust!' });
      setGamePhase('result');
      setHistory(prev => [{ result: 'loss', playerTotal: total, dealerTotal: calculateHand(dealerHand) }, ...prev.slice(0, 9)]);
      if (soundEnabled) playSound('bust');
    }
  }, [gamePhase, deck, playerHand, dealerHand, soundEnabled]);

  const stand = useCallback(async () => {
    if (gamePhase !== 'playing') return;

    setShowDealerCard(true);
    setGamePhase('dealer');
    if (soundEnabled) playSound('cardFlip');

    // Dealer draws
    let currentDeck = [...deck];
    let currentDealerHand = [...dealerHand];

    const dealerDraw = async () => {
      while (calculateHand(currentDealerHand) < 17) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newCard = currentDeck.pop();
        currentDealerHand = [...currentDealerHand, newCard];
        setDealerHand([...currentDealerHand]);
        setDeck([...currentDeck]);
        if (soundEnabled) playSound('cardDeal');
      }

      // Determine winner
      const pTotal = calculateHand(playerHand);
      const dTotal = calculateHand(currentDealerHand);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (dTotal > 21) {
        const winAmount = betAmount * 2;
        setResult({ type: 'win', message: 'Dealer Bust! You Win!', amount: winAmount });
        addBalance(winAmount);
        setHistory(prev => [{ result: 'win', playerTotal: pTotal, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        if (soundEnabled) playSound('betWin');
      } else if (pTotal > dTotal) {
        const winAmount = betAmount * 2;
        setResult({ type: 'win', message: 'You Win!', amount: winAmount });
        addBalance(winAmount);
        setHistory(prev => [{ result: 'win', playerTotal: pTotal, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        if (soundEnabled) playSound('betWin');
      } else if (pTotal < dTotal) {
        setResult({ type: 'loss', message: 'Dealer Wins' });
        setHistory(prev => [{ result: 'loss', playerTotal: pTotal, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        if (soundEnabled) playSound('betLose');
      } else {
        setResult({ type: 'push', message: 'Push' });
        addBalance(betAmount);
        setHistory(prev => [{ result: 'push', playerTotal: pTotal, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
      }

      setGamePhase('result');
    };

    dealerDraw();
  }, [gamePhase, deck, dealerHand, playerHand, betAmount, addBalance, soundEnabled]);

  const doubleDown = useCallback(() => {
    if (gamePhase !== 'playing' || playerHand.length !== 2 || betAmount > balance) return;

    subtractBalance(betAmount);

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];

    setDeck(newDeck);
    setPlayerHand(newHand);

    const total = calculateHand(newHand);
    if (total > 21) {
      setShowDealerCard(true);
      setResult({ type: 'bust', message: 'Bust!' });
      setGamePhase('result');
      setHistory(prev => [{ result: 'loss', playerTotal: total, dealerTotal: calculateHand(dealerHand) }, ...prev.slice(0, 9)]);
    } else {
      // Auto stand after double
      setTimeout(() => {
        setShowDealerCard(true);
        // Continue with dealer logic (simplified - just stand)
        const dTotal = calculateHand(dealerHand);

        if (total > dTotal || dTotal > 21) {
          const winAmount = betAmount * 4; // Double bet * 2
          setResult({ type: 'win', message: 'You Win!', amount: winAmount });
          addBalance(winAmount);
          setHistory(prev => [{ result: 'win', playerTotal: total, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        } else if (total < dTotal) {
          setResult({ type: 'loss', message: 'Dealer Wins' });
          setHistory(prev => [{ result: 'loss', playerTotal: total, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        } else {
          setResult({ type: 'push', message: 'Push' });
          addBalance(betAmount * 2);
          setHistory(prev => [{ result: 'push', playerTotal: total, dealerTotal: dTotal }, ...prev.slice(0, 9)]);
        }
        setGamePhase('result');
      }, 500);
    }
  }, [gamePhase, playerHand, deck, dealerHand, betAmount, balance, subtractBalance, addBalance]);

  const newGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setResult(null);
    setShowDealerCard(false);
    setGamePhase('betting');
    setInsuranceBet(0);
    setInsuranceOffered(false);
  };

  const takeInsurance = useCallback(() => {
    const insuranceAmount = betAmount / 2;
    if (insuranceAmount > balance) return;

    subtractBalance(insuranceAmount);
    setInsuranceBet(insuranceAmount);

    // Check if dealer has blackjack
    const dTotal = calculateHand(dealerHand);
    if (dTotal === 21) {
      // Dealer has blackjack - insurance pays 2:1
      const insuranceWin = insuranceAmount * 3; // Original bet back + 2:1 payout
      addBalance(insuranceWin);
      setShowDealerCard(true);
      setResult({ type: 'insurance', message: 'Insurance Wins!', amount: insuranceWin });
      // Player loses original bet but wins insurance
      setHistory(prev => [{ result: 'loss', playerTotal: calculateHand(playerHand), dealerTotal: 21 }, ...prev.slice(0, 9)]);
      setGamePhase('result');
      if (soundEnabled) playSound('betWin');
    } else {
      // Dealer doesn't have blackjack - insurance lost, continue game
      setGamePhase('playing');
      if (soundEnabled) playSound('betLose');
    }
  }, [betAmount, balance, dealerHand, playerHand, subtractBalance, addBalance, soundEnabled]);

  const declineInsurance = useCallback(() => {
    // Check if dealer has blackjack
    const dTotal = calculateHand(dealerHand);
    if (dTotal === 21) {
      // Dealer has blackjack - player loses
      setShowDealerCard(true);
      setResult({ type: 'loss', message: 'Dealer Blackjack!' });
      setHistory(prev => [{ result: 'loss', playerTotal: calculateHand(playerHand), dealerTotal: 21 }, ...prev.slice(0, 9)]);
      setGamePhase('result');
      if (soundEnabled) playSound('betLose');
    } else {
      // Continue normal play
      setGamePhase('playing');
    }
  }, [dealerHand, playerHand, soundEnabled]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Game table */}
        <div className="flex-1 bg-gradient-to-b from-green-900 to-green-800 border border-green-700 rounded-xl p-6 flex flex-col items-center justify-between min-h-[500px] relative">

          {/* Dealer area */}
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2 uppercase tracking-wider">Dealer</div>
            <div className="flex gap-2 justify-center min-h-[112px]">
              {dealerHand.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <Card card={card} hidden={i === 1 && !showDealerCard} />
                </motion.div>
              ))}
            </div>
            {showDealerCard && dealerHand.length > 0 && (
              <div className="mt-2 text-xl font-bold text-white">
                {dealerTotal}
              </div>
            )}
          </div>

          {/* Result overlay */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-xl text-center z-10 ${
                  result.type === 'win' || result.type === 'blackjack' ? 'bg-casino-green' :
                  result.type === 'loss' || result.type === 'bust' ? 'bg-casino-red' :
                  'bg-casino-gold'
                }`}
              >
                <div className="text-2xl font-black text-white">{result.message}</div>
                {result.amount && (
                  <div className="text-xl font-bold text-white/90">+${result.amount.toFixed(2)}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player area */}
          <div className="text-center">
            {playerHand.length > 0 && (
              <div className="mb-2 text-xl font-bold text-white">
                {playerTotal}
                {playerTotal === 21 && playerHand.length === 2 && (
                  <span className="ml-2 text-casino-gold">BLACKJACK!</span>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-center min-h-[112px]">
              {playerHand.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <Card card={card} />
                </motion.div>
              ))}
            </div>
            <div className="text-white/70 text-sm mt-2 uppercase tracking-wider">Your Hand</div>
          </div>
        </div>

        {/* History */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 max-h-12">
          {history.slice(0, 15).map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold ${
                h.result === 'win' ? 'bg-casino-green/20 text-casino-green' :
                h.result === 'loss' ? 'bg-casino-red/20 text-casino-red' :
                'bg-casino-gold/20 text-casino-gold'
              }`}
            >
              {h.playerTotal} vs {h.dealerTotal}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {gamePhase === 'betting' ? (
          <BetControls
            betAmount={betAmount}
            onBetChange={setBetAmount}
            onBet={deal}
            balance={balance}
            buttonText="DEAL"
            showAutoBet={false}
          />
        ) : (
          <div className="bg-casino-card border border-casino-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bet</span>
              <span className="text-white font-bold">${betAmount.toFixed(2)}</span>
            </div>

            {gamePhase === 'insurance' && (
              <div className="space-y-3">
                <div className="text-center text-sm text-casino-gold mb-2">
                  Dealer shows Ace - Insurance?
                </div>
                <div className="text-center text-xs text-gray-400 mb-3">
                  Cost: ${(betAmount / 2).toFixed(2)} | Pays 2:1 if dealer has Blackjack
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={takeInsurance}
                    disabled={(betAmount / 2) > balance}
                    className="py-3 bg-casino-gold text-casino-bg rounded-lg font-bold uppercase disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={declineInsurance}
                    className="py-3 bg-casino-border text-white rounded-lg font-bold uppercase"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {gamePhase === 'playing' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={hit}
                  className="py-3 bg-casino-cyan text-casino-bg rounded-lg font-bold uppercase"
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  className="py-3 bg-casino-gold text-casino-bg rounded-lg font-bold uppercase"
                >
                  Stand
                </button>
                <button
                  onClick={doubleDown}
                  disabled={playerHand.length !== 2 || betAmount > balance}
                  className="col-span-2 py-3 bg-casino-purple text-white rounded-lg font-bold uppercase disabled:opacity-50"
                >
                  Double Down
                </button>
              </div>
            )}

            {gamePhase === 'result' && (
              <button
                onClick={newGame}
                className="w-full py-3 bg-casino-cyan text-casino-bg rounded-lg font-bold uppercase"
              >
                New Hand
              </button>
            )}

            {gamePhase === 'dealer' && (
              <div className="text-center py-4">
                <div className="animate-pulse text-casino-gold">Dealer drawing...</div>
              </div>
            )}
          </div>
        )}

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Payouts</h3>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Blackjack</span>
              <span className="text-casino-gold">3:2</span>
            </div>
            <div className="flex justify-between">
              <span>Win</span>
              <span className="text-casino-green">1:1</span>
            </div>
            <div className="flex justify-between">
              <span>Insurance</span>
              <span>2:1</span>
            </div>
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Beat the dealer without going over 21. Face cards are 10, Aces are 1 or 11.
            Blackjack pays 3:2. Dealer stands on 17.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
