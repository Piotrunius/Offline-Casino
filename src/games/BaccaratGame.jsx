import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCard = () => ({
  suit: SUITS[Math.floor(Math.random() * 4)],
  value: VALUES[Math.floor(Math.random() * 13)],
  idx: Math.floor(Math.random() * 13)
});

const cardValue = (card) => {
  if (!card) return 0;
  if (['10', 'J', 'Q', 'K'].includes(card.value)) return 0;
  if (card.value === 'A') return 1;
  return parseInt(card.value);
};

const handValue = (cards) => {
  if (!cards || cards.length === 0) return 0;
  return cards.reduce((sum, c) => sum + cardValue(c), 0) % 10;
};

const Card = ({ card }) => {
  if (!card) return null;
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center shadow-lg ${isRed ? 'bg-white text-red-600' : 'bg-white text-gray-900'}`}>
      <span className="font-black text-sm">{card.value}</span>
      <span className="text-xs">{card.suit}</span>
    </div>
  );
};

export default function BaccaratGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('player'); // player, banker, tie
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const MULTIPLIERS = { player: 2, banker: 1.95, tie: 9 };

  const play = useCallback(() => {
    if (bet <= 0 || bet > state.balance || gamePhase !== 'betting') return;
    if (!placeBet(bet, 'baccarat')) return;

    setResult(null);
    setGamePhase('dealing');
    audio.playBet();

    // Initial deal
    const pCards = [getCard(), getCard()];
    const bCards = [getCard(), getCard()];
    setPlayerCards(pCards);
    setBankerCards(bCards);

    const delay = state.settings.fastMode ? 200 : 500;

    // Check for third cards
    setTimeout(() => {
      let finalP = [...pCards];
      let finalB = [...bCards];
      const pVal = handValue(pCards);
      const bVal = handValue(bCards);

      // Natural - no more cards
      if (pVal >= 8 || bVal >= 8) {
        determineWinner(finalP, finalB);
        return;
      }

      // Player third card rules
      let playerThird = null;
      if (pVal <= 5) {
        playerThird = getCard();
        finalP = [...finalP, playerThird];
        setPlayerCards(finalP);
      }

      setTimeout(() => {
        // Banker third card rules
        if (playerThird === null) {
          // Player stands, banker draws on 0-5
          if (bVal <= 5) {
            const bankerThird = getCard();
            finalB = [...finalB, bankerThird];
            setBankerCards(finalB);
          }
        } else {
          // Player drew, complex banker rules
          const pThirdVal = cardValue(playerThird);
          let bankerDraws = false;

          if (bVal <= 2) bankerDraws = true;
          else if (bVal === 3 && pThirdVal !== 8) bankerDraws = true;
          else if (bVal === 4 && [2, 3, 4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
          else if (bVal === 5 && [4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
          else if (bVal === 6 && [6, 7].includes(pThirdVal)) bankerDraws = true;

          if (bankerDraws) {
            const bankerThird = getCard();
            finalB = [...finalB, bankerThird];
            setBankerCards(finalB);
          }
        }

        setTimeout(() => determineWinner(finalP, finalB), delay);
      }, delay);
    }, delay);
  }, [bet, state.balance, gamePhase, betType, state.settings.fastMode, placeBet]);

  const determineWinner = (pCards, bCards) => {
    const pVal = handValue(pCards);
    const bVal = handValue(bCards);

    let outcome, mult;
    if (pVal > bVal) {
      outcome = 'player';
      mult = betType === 'player' ? MULTIPLIERS.player : 0;
    } else if (bVal > pVal) {
      outcome = 'banker';
      mult = betType === 'banker' ? MULTIPLIERS.banker : 0;
    } else {
      outcome = 'tie';
      mult = betType === 'tie' ? MULTIPLIERS.tie : 0;
    }

    const won = (outcome === 'player' && betType === 'player') ||
                (outcome === 'banker' && betType === 'banker') ||
                (outcome === 'tie' && betType === 'tie');

    const winAmount = won ? bet * mult : 0;
    const profit = winAmount - bet;

    setResult({ outcome, won, mult: won ? mult : 0, profit, pVal, bVal });
    setHistory(h => [{ outcome, won, betType }, ...h.slice(0, 4)]);
    setGamePhase('ended');

    if (won) {
      addWin(winAmount, bet, 'baccarat', mult);
      audio.playWin();
    } else {
      addWin(0, bet, 'baccarat', 0);
      audio.playLose();
    }
  };

  const newGame = () => {
    setPlayerCards([]);
    setBankerCards([]);
    setGamePhase('betting');
    setResult(null);
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col">
        {/* Banker */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 uppercase mb-2">
            Banker {bankerCards.length > 0 && `(${handValue(bankerCards)})`}
          </span>
          <div className="flex gap-2">
            {bankerCards.length > 0 ? (
              bankerCards.map((c, i) => <Card key={i} card={c} />)
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-red-900/50 rounded-lg" />
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-2 rounded-xl ${
            result.won ? 'bg-green-900/50' : 'bg-red-900/50'
          }`}>
            <span className={`text-lg font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.outcome.toUpperCase()} WINS ({result.pVal} vs {result.bVal})
              {result.won ? ` → +$${result.profit.toFixed(2)}` : ` → -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* Player */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex gap-2">
            {playerCards.length > 0 ? (
              playerCards.map((c, i) => <Card key={i} card={c} />)
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-blue-900/50 rounded-lg" />
            )}
          </div>
          <span className="text-xs text-gray-500 uppercase mt-2">
            Player {playerCards.length > 0 && `(${handValue(playerCards)})`}
          </span>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-2">
            {history.map((h, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded font-bold ${
                h.outcome === 'player' ? 'bg-blue-900/50 text-blue-400' :
                h.outcome === 'banker' ? 'bg-red-900/50 text-red-400' :
                'bg-green-900/50 text-green-400'
              }`}>
                {h.outcome === 'player' ? 'P' : h.outcome === 'banker' ? 'B' : 'T'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Bet Type */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet On</label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              <button
                onClick={() => gamePhase === 'betting' && setBetType('player')}
                disabled={gamePhase !== 'betting'}
                className={`py-2 rounded font-bold text-sm ${
                  betType === 'player' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-blue-400'
                }`}
              >
                PLAYER
                <div className="text-xs opacity-70">2x</div>
              </button>
              <button
                onClick={() => gamePhase === 'betting' && setBetType('tie')}
                disabled={gamePhase !== 'betting'}
                className={`py-2 rounded font-bold text-sm ${
                  betType === 'tie' ? 'bg-green-600 text-white' : 'bg-gray-800 text-green-400'
                }`}
              >
                TIE
                <div className="text-xs opacity-70">9x</div>
              </button>
              <button
                onClick={() => gamePhase === 'betting' && setBetType('banker')}
                disabled={gamePhase !== 'betting'}
                className={`py-2 rounded font-bold text-sm ${
                  betType === 'banker' ? 'bg-red-600 text-white' : 'bg-gray-800 text-red-400'
                }`}
              >
                BANKER
                <div className="text-xs opacity-70">1.95x</div>
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={gamePhase !== 'betting'}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={gamePhase !== 'betting'} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={gamePhase !== 'betting'} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Your bet</span>
              <span className={`font-bold ${
                betType === 'player' ? 'text-blue-400' :
                betType === 'banker' ? 'text-red-400' : 'text-green-400'
              }`}>
                {betType.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Potential win</span>
              <span className="text-cyan-400 font-bold">${(bet * MULTIPLIERS[betType]).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          {gamePhase === 'betting' ? (
            <button
              onClick={play}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-black text-lg disabled:opacity-50 mt-auto"
            >
              DEAL CARDS
            </button>
          ) : gamePhase === 'dealing' ? (
            <button disabled className="w-full py-3 rounded-xl bg-gray-700 text-gray-400 font-black mt-auto">
              DEALING...
            </button>
          ) : (
            <button
              onClick={newGame}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-lg mt-auto"
            >
              NEW GAME
            </button>
          )}

          {/* Rules */}
          <div className="text-xs text-gray-600 text-center">
            Closest to 9 wins • Face cards = 0
          </div>
        </div>
      </div>
    </div>
  );
}
