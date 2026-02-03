import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const HOUSE_EDGE = 0.0106; // Banker bet has ~1.06% edge

const createDeck = () => {
  const deck = [];
  for (let d = 0; d < 8; d++) { // 8 deck shoe
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value, color: suit === '♥' || suit === '♦' ? 'red' : 'black' });
      }
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getCardValue = (card) => {
  if (['10', 'J', 'Q', 'K'].includes(card.value)) return 0;
  if (card.value === 'A') return 1;
  return parseInt(card.value);
};

const getHandValue = (cards) => {
  return cards.reduce((sum, card) => sum + getCardValue(card), 0) % 10;
};

const Card = ({ card }) => (
  <div className="w-14 h-20 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg">
    <div className={`text-center ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
      <div className="text-lg font-bold">{card.value}</div>
      <div className="text-xl">{card.suit}</div>
    </div>
  </div>
);

export default function BaccaratGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('player');
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [bankerHand, setBankerHand] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);

  const deal = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'baccarat')) return;

    let currentDeck = deck.length < 20 ? createDeck() : [...deck];

    // Initial deal - 2 cards each
    const pHand = [currentDeck.pop(), currentDeck.pop()];
    const bHand = [currentDeck.pop(), currentDeck.pop()];

    setPlayerHand(pHand);
    setBankerHand(bHand);
    setDeck(currentDeck);
    setPlaying(true);
    setResult(null);
    audio.playCardDeal();

    // Apply baccarat drawing rules
    setTimeout(() => {
      let finalPHand = [...pHand];
      let finalBHand = [...bHand];
      let pValue = getHandValue(pHand);
      let bValue = getHandValue(bHand);

      // Check for natural (8 or 9)
      if (pValue >= 8 || bValue >= 8) {
        finishGame(finalPHand, finalBHand, currentDeck);
        return;
      }

      // Player draws third card if 0-5
      let playerThird = null;
      if (pValue <= 5) {
        playerThird = currentDeck.pop();
        finalPHand.push(playerThird);
        setPlayerHand([...finalPHand]);
        audio.playCardDeal();
      }

      // Banker drawing rules
      setTimeout(() => {
        const pThirdValue = playerThird ? getCardValue(playerThird) : null;
        bValue = getHandValue(finalBHand);
        let bankerDraws = false;

        if (!playerThird) {
          // Player stood, banker draws on 0-5
          bankerDraws = bValue <= 5;
        } else {
          // Complex banker rules based on player's third card
          if (bValue <= 2) bankerDraws = true;
          else if (bValue === 3 && pThirdValue !== 8) bankerDraws = true;
          else if (bValue === 4 && [2, 3, 4, 5, 6, 7].includes(pThirdValue)) bankerDraws = true;
          else if (bValue === 5 && [4, 5, 6, 7].includes(pThirdValue)) bankerDraws = true;
          else if (bValue === 6 && [6, 7].includes(pThirdValue)) bankerDraws = true;
        }

        if (bankerDraws) {
          finalBHand.push(currentDeck.pop());
          setBankerHand([...finalBHand]);
          audio.playCardDeal();
        }

        setTimeout(() => {
          finishGame(finalPHand, finalBHand, currentDeck);
        }, 500);
      }, 500);
    }, state.settings.fastMode ? 400 : 800);
  }, [bet, state.balance, state.settings.fastMode, deck, placeBet]);

  const finishGame = useCallback((pHand, bHand, currentDeck) => {
    const pValue = getHandValue(pHand);
    const bValue = getHandValue(bHand);

    setDeck([...currentDeck]);
    setPlaying(false);

    let winner;
    if (pValue > bValue) winner = 'player';
    else if (bValue > pValue) winner = 'banker';
    else winner = 'tie';

    const won = betType === winner || (betType === 'tie' && winner === 'tie');
    let mult = 0;
    if (won) {
      if (betType === 'player') mult = 2;
      else if (betType === 'banker') mult = 1.95; // 5% commission
      else if (betType === 'tie') mult = 9;
    }

    if (mult > 0) {
      const win = bet * mult;
      addWin(win, bet, 'baccarat', mult);
      setResult({ won: true, winner, pValue, bValue, profit: win - bet });
      audio.playWin();
    } else {
      addWin(0, bet, 'baccarat', 0);
      setResult({ won: false, winner, pValue, bValue, profit: -bet });
      audio.playLose();
    }
  }, [betType, bet, addWin]);

  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-4">House Edge: {(HOUSE_EDGE * 100).toFixed(2)}%</div>

        {/* Hands Display */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Player */}
          <div className={`p-4 rounded-xl ${result?.winner === 'player' ? 'bg-blue-900/30 ring-2 ring-blue-500' : 'bg-black/30'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-blue-400 uppercase font-bold">Player</span>
              {playerHand.length > 0 && (
                <span className="text-2xl font-black text-blue-400">{getHandValue(playerHand)}</span>
              )}
            </div>
            <div className="flex gap-2 justify-center min-h-[80px]">
              {playerHand.map((card, i) => (
                <Card key={i} card={card} />
              ))}
            </div>
          </div>

          {/* Banker */}
          <div className={`p-4 rounded-xl ${result?.winner === 'banker' ? 'bg-red-900/30 ring-2 ring-red-500' : 'bg-black/30'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-red-400 uppercase font-bold">Banker</span>
              {bankerHand.length > 0 && (
                <span className="text-2xl font-black text-red-400">{getHandValue(bankerHand)}</span>
              )}
            </div>
            <div className="flex gap-2 justify-center min-h-[80px]">
              {bankerHand.map((card, i) => (
                <Card key={i} card={card} />
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className="text-sm text-gray-400 uppercase mb-1">
              {result.winner === 'tie' ? 'Tie!' : `${result.winner} wins`}
            </div>
            <div className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${result.profit.toFixed(2)}` : 'No Win'}
            </div>
          </div>
        )}

        {/* Bet Type Selection */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button onClick={() => !playing && setBetType('player')}
            disabled={playing}
            className={`py-3 rounded-xl font-bold transition ${
              betType === 'player' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}>
            <div>PLAYER</div>
            <div className="text-xs opacity-70">2x</div>
          </button>
          <button onClick={() => !playing && setBetType('tie')}
            disabled={playing}
            className={`py-3 rounded-xl font-bold transition ${
              betType === 'tie' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}>
            <div>TIE</div>
            <div className="text-xs opacity-70">9x</div>
          </button>
          <button onClick={() => !playing && setBetType('banker')}
            disabled={playing}
            className={`py-3 rounded-xl font-bold transition ${
              betType === 'banker' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}>
            <div>BANKER</div>
            <div className="text-xs opacity-70">1.95x</div>
          </button>
        </div>

        {/* Deal Button */}
        <button onClick={deal} disabled={playing || bet <= 0 || bet > state.balance}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
          {playing ? 'DEALING...' : 'DEAL'}
        </button>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={deal} buttonText="DEAL" hideButton />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Rules</div>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>- Closest to 9 wins</li>
            <li>- Face cards and 10s = 0</li>
            <li>- Ace = 1</li>
            <li>- 8-9 deck shoe</li>
            <li>- Banker wins pay 5% commission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
