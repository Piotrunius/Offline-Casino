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

const calcValue = (cards) => {
  if (!cards || cards.length === 0) return 0;
  let val = 0, aces = 0;
  cards.forEach(c => {
    if (!c) return;
    if (c.value === 'A') { val += 11; aces++; }
    else if (['K', 'Q', 'J'].includes(c.value)) val += 10;
    else val += parseInt(c.value);
  });
  while (val > 21 && aces > 0) { val -= 10; aces--; }
  return val;
};

const Card = ({ card, hidden = false }) => {
  if (hidden) {
    return (
      <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center shadow-lg">
        <span className="text-blue-400 text-2xl">?</span>
      </div>
    );
  }
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  return (
    <div className={`w-14 h-20 rounded-lg flex flex-col items-center justify-center shadow-lg ${isRed ? 'bg-white text-red-600' : 'bg-white text-gray-900'}`}>
      <span className="font-black text-lg">{card?.value}</span>
      <span className="text-sm">{card?.suit}</span>
    </div>
  );
};

export default function BlackjackGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [gamePhase, setGamePhase] = useState('betting'); // betting, playing, dealer, ended
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const deal = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    audio.playBet();
    setResult(null);

    const pCards = [getCard(), getCard()];
    const dCards = [getCard(), getCard()];

    setPlayerCards(pCards);
    setDealerCards(dCards);

    // Check blackjack
    const pVal = calcValue(pCards);
    if (pVal === 21) {
      const dVal = calcValue(dCards);
      if (dVal === 21) {
        endGame('push', pCards, dCards, 1);
      } else {
        endGame('blackjack', pCards, dCards, 2.5);
      }
    } else {
      setGamePhase('playing');
    }
  }, [bet, state.balance, placeBet]);

  const hit = useCallback(() => {
    if (gamePhase !== 'playing') return;

    const newCard = getCard();
    const newCards = [...playerCards, newCard];
    setPlayerCards(newCards);
    audio.playBet();

    if (calcValue(newCards) > 21) {
      endGame('bust', newCards, dealerCards, 0);
    }
  }, [gamePhase, playerCards, dealerCards]);

  const stand = useCallback(() => {
    if (gamePhase !== 'playing') return;
    setGamePhase('dealer');

    let dCards = [...dealerCards];
    const playDealer = () => {
      if (calcValue(dCards) < 17) {
        dCards = [...dCards, getCard()];
        setDealerCards([...dCards]);
        setTimeout(playDealer, state.settings.fastMode ? 200 : 400);
      } else {
        const pVal = calcValue(playerCards);
        const dVal = calcValue(dCards);

        if (dVal > 21) {
          endGame('win', playerCards, dCards, 2);
        } else if (dVal > pVal) {
          endGame('lose', playerCards, dCards, 0);
        } else if (pVal > dVal) {
          endGame('win', playerCards, dCards, 2);
        } else {
          endGame('push', playerCards, dCards, 1);
        }
      }
    };
    setTimeout(playDealer, state.settings.fastMode ? 200 : 400);
  }, [gamePhase, dealerCards, playerCards, state.settings.fastMode]);

  const double = useCallback(() => {
    if (gamePhase !== 'playing' || playerCards.length !== 2) return;
    if (bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    setBet(bet * 2);
    const newCard = getCard();
    const newCards = [...playerCards, newCard];
    setPlayerCards(newCards);
    audio.playBet();

    if (calcValue(newCards) > 21) {
      endGame('bust', newCards, dealerCards, 0);
    } else {
      setTimeout(() => stand(), state.settings.fastMode ? 200 : 400);
    }
  }, [gamePhase, playerCards, bet, state.balance, dealerCards, placeBet, stand, state.settings.fastMode]);

  const endGame = (outcome, pCards, dCards, mult) => {
    setGamePhase('ended');
    const winAmount = bet * mult;
    const profit = winAmount - bet;

    setResult({ outcome, mult, profit, pVal: calcValue(pCards), dVal: calcValue(dCards) });
    setHistory(h => [{ outcome, mult, bet }, ...h.slice(0, 4)]);

    if (mult > 0) {
      addWin(winAmount, bet, 'blackjack', mult);
      if (mult > 1) audio.playWin(); else audio.playLose();
    } else {
      addWin(0, bet, 'blackjack', 0);
      audio.playLose();
    }
  };

  const newGame = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setGamePhase('betting');
    setResult(null);
    setBet(state.globalBet || bet);
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const pVal = calcValue(playerCards);
  const dVal = gamePhase === 'ended' || gamePhase === 'dealer' ? calcValue(dealerCards) : calcValue([dealerCards[0]]);

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col">
        {/* Dealer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 uppercase mb-2">Dealer {(gamePhase === 'ended' || gamePhase === 'dealer') && `(${calcValue(dealerCards)})`}</span>
          <div className="flex gap-2">
            {dealerCards.length > 0 ? (
              dealerCards.map((c, i) => (
                <Card key={i} card={c} hidden={i === 1 && gamePhase === 'playing'} />
              ))
            ) : (
              <div className="w-14 h-20 border-2 border-dashed border-gray-700 rounded-lg" />
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-2 rounded-xl ${
            result.outcome === 'blackjack' ? 'bg-yellow-900/50' :
            result.outcome === 'win' ? 'bg-green-900/50' :
            result.outcome === 'push' ? 'bg-gray-700/50' : 'bg-red-900/50'
          }`}>
            <span className={`text-lg font-black ${
              result.outcome === 'blackjack' ? 'text-yellow-400' :
              result.outcome === 'win' ? 'text-green-400' :
              result.outcome === 'push' ? 'text-gray-300' : 'text-red-400'
            }`}>
              {result.outcome === 'blackjack' ? `BLACKJACK! +$${result.profit.toFixed(2)}` :
               result.outcome === 'win' ? `WIN! +$${result.profit.toFixed(2)}` :
               result.outcome === 'push' ? 'PUSH' :
               result.outcome === 'bust' ? `BUST! -$${bet.toFixed(2)}` :
               `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* Player */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex gap-2">
            {playerCards.length > 0 ? (
              playerCards.map((c, i) => <Card key={i} card={c} />)
            ) : (
              <div className="w-14 h-20 border-2 border-dashed border-gray-700 rounded-lg" />
            )}
          </div>
          <span className="text-xs text-gray-500 uppercase mt-2">You {pVal > 0 && `(${pVal})`}</span>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-2">
            {history.map((h, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${
                h.outcome === 'blackjack' || h.outcome === 'win' ? 'bg-green-900/50 text-green-400' :
                h.outcome === 'push' ? 'bg-gray-700/50 text-gray-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {h.mult}x
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
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
              <span className="text-gray-500">Blackjack pays</span>
              <span className="text-yellow-400 font-bold">3:2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Win pays</span>
              <span className="text-green-400 font-bold">2:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Push</span>
              <span className="text-gray-400 font-bold">Bet back</span>
            </div>
          </div>

          {/* Actions */}
          {gamePhase === 'betting' ? (
            <button
              onClick={deal}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50"
            >
              DEAL
            </button>
          ) : gamePhase === 'playing' ? (
            <div className="flex flex-col gap-2">
              <button onClick={hit} className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black">
                HIT
              </button>
              <button onClick={stand} className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black">
                STAND
              </button>
              {playerCards.length === 2 && bet <= state.balance && (
                <button onClick={double} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black">
                  DOUBLE DOWN
                </button>
              )}
            </div>
          ) : gamePhase === 'dealer' ? (
            <button disabled className="w-full py-3 rounded-xl bg-gray-700 text-gray-400 font-black">
              DEALER PLAYING...
            </button>
          ) : (
            <button onClick={newGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-black text-lg">
              NEW GAME
            </button>
          )}

          {/* Status */}
          <div className="mt-auto bg-black/30 rounded-lg p-2 text-center">
            <span className={`text-sm font-bold ${
              gamePhase === 'betting' ? 'text-gray-400' :
              gamePhase === 'playing' ? 'text-cyan-400' :
              gamePhase === 'dealer' ? 'text-orange-400' : 'text-green-400'
            }`}>
              {gamePhase === 'betting' ? 'Place your bet' :
               gamePhase === 'playing' ? `Your turn (${pVal})` :
               gamePhase === 'dealer' ? 'Dealer drawing...' : 'Game over'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
