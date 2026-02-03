import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const HOUSE_EDGE = 0.005;

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, color: suit === '♥' || suit === '♦' ? 'red' : 'black' });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calcValue = (cards) => {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.value === 'A') { aces++; total += 11; }
    else if (['K', 'Q', 'J'].includes(card.value)) total += 10;
    else total += parseInt(card.value);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

const Card = ({ card, hidden }) => (
  <div className={`w-16 h-22 rounded-lg border-2 ${hidden ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} flex items-center justify-center shadow-lg`}>
    {hidden ? (
      <div className="w-12 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded" />
    ) : (
      <div className={`text-center ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        <div className="text-xl font-bold">{card.value}</div>
        <div className="text-2xl">{card.suit}</div>
      </div>
    )}
  </div>
);

export default function BlackjackGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [showInsurance, setShowInsurance] = useState(false);
  const [dealerHidden, setDealerHidden] = useState(true);

  const isBlackjack = (cards) => cards.length === 2 && calcValue(cards) === 21;

  const deal = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    const newDeck = createDeck();
    const pCards = [newDeck.pop(), newDeck.pop()];
    const dCards = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayer(pCards);
    setDealer(dCards);
    setPlaying(true);
    setGameOver(false);
    setResult(null);
    setInsuranceBet(0);
    setDealerHidden(true);
    audio.playCardDeal();

    // Check for insurance offer (dealer shows Ace)
    if (dCards[0].value === 'A' && state.balance >= bet / 2) {
      setShowInsurance(true);
      return;
    }

    // Immediate blackjack check (only if no insurance offered)
    setTimeout(() => checkBlackjacks(pCards, dCards, newDeck, 0), 300);
  }, [bet, state.balance, placeBet]);

  const checkBlackjacks = useCallback((pCards, dCards, currentDeck, insurance) => {
    const playerBJ = isBlackjack(pCards);
    const dealerBJ = isBlackjack(dCards);

    if (playerBJ || dealerBJ) {
      setDealerHidden(false);
      setPlaying(false);
      setGameOver(true);

      if (playerBJ && dealerBJ) {
        // Push - return bet
        addWin(bet, bet, 'blackjack', 1);
        setResult({ type: 'PUSH', msg: 'Both Blackjack - Push', profit: 0 });
        audio.playLose();
      } else if (playerBJ) {
        // Player blackjack pays 3:2
        const win = bet * 2.5;
        addWin(win, bet, 'blackjack', 2.5);
        setResult({ type: 'BLACKJACK', msg: 'Blackjack!', profit: win - bet });
        audio.playWin();
      } else if (dealerBJ) {
        // Dealer blackjack
        const insuranceWin = insurance > 0 ? insurance * 3 : 0;
        if (insuranceWin > 0) {
          addWin(insuranceWin, bet + insurance, 'blackjack', insuranceWin / (bet + insurance));
          setResult({ type: 'DEALER_BJ', msg: 'Dealer Blackjack - Insurance Pays', profit: insuranceWin - bet - insurance });
        } else {
          addWin(0, bet, 'blackjack', 0);
          setResult({ type: 'DEALER_BJ', msg: 'Dealer Blackjack', profit: -bet });
        }
        audio.playLose();
      }
      return true;
    }
    return false;
  }, [bet, addWin]);

  const takeInsurance = useCallback(() => {
    const insAmount = bet / 2;
    if (!placeBet(insAmount, 'blackjack')) return;
    setInsuranceBet(insAmount);
    setShowInsurance(false);
    checkBlackjacks(player, dealer, deck, insAmount);
  }, [bet, player, dealer, deck, placeBet, checkBlackjacks]);

  const declineInsurance = useCallback(() => {
    setShowInsurance(false);
    checkBlackjacks(player, dealer, deck, 0);
  }, [player, dealer, deck, checkBlackjacks]);

  const hit = useCallback(() => {
    if (!playing || gameOver) return;
    const card = deck.pop();
    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck([...deck]);
    audio.playCardDeal();

    const value = calcValue(newPlayer);
    if (value > 21) {
      setPlaying(false);
      setGameOver(true);
      setDealerHidden(false);
      addWin(0, bet, 'blackjack', 0);
      setResult({ type: 'BUST', msg: 'Bust!', profit: -bet - insuranceBet });
      audio.playLose();
    }
  }, [playing, gameOver, deck, player, bet, insuranceBet, addWin]);

  const stand = useCallback(() => {
    if (!playing || gameOver) return;
    setPlaying(false);
    setDealerHidden(false);

    let currentDealer = [...dealer];
    let currentDeck = [...deck];

    const dealerPlay = () => {
      const dealerVal = calcValue(currentDealer);
      const playerVal = calcValue(player);

      if (dealerVal < 17) {
        setTimeout(() => {
          currentDealer.push(currentDeck.pop());
          setDealer([...currentDealer]);
          setDeck([...currentDeck]);
          audio.playCardDeal();
          dealerPlay();
        }, state.settings.fastMode ? 200 : 500);
      } else {
        // Game resolution
        setGameOver(true);
        const finalDealerVal = calcValue(currentDealer);
        const finalPlayerVal = calcValue(player);

        if (finalDealerVal > 21) {
          // Dealer bust
          const win = bet * 2;
          addWin(win, bet, 'blackjack', 2);
          setResult({ type: 'WIN', msg: 'Dealer Busts!', profit: win - bet - insuranceBet });
          audio.playWin();
        } else if (finalPlayerVal > finalDealerVal) {
          // Player wins
          const win = bet * 2;
          addWin(win, bet, 'blackjack', 2);
          setResult({ type: 'WIN', msg: 'You Win!', profit: win - bet - insuranceBet });
          audio.playWin();
        } else if (finalPlayerVal < finalDealerVal) {
          // Dealer wins
          addWin(0, bet, 'blackjack', 0);
          setResult({ type: 'LOSE', msg: 'Dealer Wins', profit: -bet - insuranceBet });
          audio.playLose();
        } else {
          // Push
          addWin(bet, bet, 'blackjack', 1);
          setResult({ type: 'PUSH', msg: 'Push', profit: -insuranceBet });
          audio.playLose();
        }
      }
    };

    dealerPlay();
  }, [playing, gameOver, dealer, deck, player, bet, insuranceBet, state.settings.fastMode, addWin]);

  const double = useCallback(() => {
    if (!playing || gameOver || player.length !== 2 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    const card = deck.pop();
    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck([...deck]);
    audio.playCardDeal();

    const value = calcValue(newPlayer);
    if (value > 21) {
      setPlaying(false);
      setGameOver(true);
      setDealerHidden(false);
      addWin(0, bet * 2, 'blackjack', 0);
      setResult({ type: 'BUST', msg: 'Bust!', profit: -bet * 2 - insuranceBet });
      audio.playLose();
    } else {
      // Auto-stand after double
      setBet(bet * 2);
      setTimeout(() => {
        stand();
      }, 500);
    }
  }, [playing, gameOver, player, bet, state.balance, deck, insuranceBet, placeBet, addWin, stand]);

  const playerValue = calcValue(player);
  const dealerValue = dealerHidden ? calcValue([dealer[0]]) : calcValue(dealer);

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-4">House Edge: {(HOUSE_EDGE * 100).toFixed(1)}%</div>

        {/* Dealer */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400 uppercase">Dealer</span>
            <span className="text-lg font-bold text-yellow-400">
              {dealer.length > 0 && (dealerHidden ? `${calcValue([dealer[0]])}` : dealerValue)}
              {!dealerHidden && dealerValue > 21 && <span className="text-red-500 ml-2">BUST</span>}
            </span>
          </div>
          <div className="flex gap-2 justify-center min-h-[88px]">
            {dealer.map((card, i) => (
              <Card key={i} card={card} hidden={dealerHidden && i === 1} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${
            result.type === 'WIN' || result.type === 'BLACKJACK' ? 'bg-green-900/50 text-green-400' :
            result.type === 'PUSH' ? 'bg-yellow-900/50 text-yellow-400' :
            'bg-red-900/50 text-red-400'
          }`}>
            <div className="text-2xl font-black">{result.msg}</div>
            <div className="text-lg">
              {result.profit >= 0 ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {/* Insurance Modal */}
        {showInsurance && (
          <div className="text-center py-4 mb-4 rounded-lg bg-blue-900/50 border border-blue-500">
            <div className="text-lg font-bold text-blue-300 mb-3">Insurance?</div>
            <div className="text-sm text-gray-300 mb-4">Dealer shows Ace. Insurance costs ${(bet/2).toFixed(2)}</div>
            <div className="flex gap-4 justify-center">
              <button onClick={takeInsurance} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold">
                Yes (${(bet/2).toFixed(2)})
              </button>
              <button onClick={declineInsurance} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 font-bold">
                No
              </button>
            </div>
          </div>
        )}

        {/* Player */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400 uppercase">Player</span>
            <span className="text-lg font-bold text-cyan-400">
              {player.length > 0 && playerValue}
              {isBlackjack(player) && <span className="text-yellow-400 ml-2">BLACKJACK!</span>}
              {playerValue > 21 && <span className="text-red-500 ml-2">BUST</span>}
            </span>
          </div>
          <div className="flex gap-2 justify-center min-h-[88px]">
            {player.map((card, i) => (
              <Card key={i} card={card} hidden={false} />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={deal} disabled={playing || showInsurance}
            className="py-3 rounded-lg bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold disabled:opacity-50">
            DEAL
          </button>
          <button onClick={hit} disabled={!playing || gameOver || showInsurance}
            className="py-3 rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold disabled:opacity-50">
            HIT
          </button>
          <button onClick={stand} disabled={!playing || gameOver || showInsurance}
            className="py-3 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-bold disabled:opacity-50">
            STAND
          </button>
          <button onClick={double} disabled={!playing || gameOver || player.length !== 2 || bet > state.balance || showInsurance}
            className="py-3 rounded-lg bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold disabled:opacity-50">
            DOUBLE
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={deal} buttonText="DEAL" hideButton />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Payouts</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Win</span><span className="text-green-400">2x</span></div>
            <div className="flex justify-between"><span>Blackjack</span><span className="text-yellow-400">2.5x</span></div>
            <div className="flex justify-between"><span>Insurance</span><span className="text-blue-400">3x</span></div>
            <div className="flex justify-between"><span>Push</span><span className="text-gray-400">1x</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
