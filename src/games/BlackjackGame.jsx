import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const OUTCOME_EXPLANATIONS = {
  'blackjack': 'Blackjack! First two cards are an Ace + a 10-value card',
  'win': 'You win! Your hand is higher than the dealer without exceeding 21',
  'push': 'Tie - both hands have the same value',
  'lose': 'You lose - dealer has a higher value or you busted over 21',
  'dealer_bust': 'You win! The dealer busted (exceeded 21)'
};

const getCard = () => ({
  suit: SUITS[Math.floor(Math.random() * 4)],
  value: VALUES[Math.floor(Math.random() * 13)],
  idx: Math.floor(Math.random() * 13)
});

// Get blackjack cards (Ace + 10-value card)
const getBlackjackCards = () => {
  const ace = { suit: SUITS[Math.floor(Math.random() * 4)], value: 'A', idx: 0 };
  const tenVal = ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)];
  const ten = { suit: SUITS[Math.floor(Math.random() * 4)], value: tenVal, idx: VALUES.indexOf(tenVal) };
  return Math.random() > 0.5 ? [ace, ten] : [ten, ace];
};

// Get bust cards for dealer (total > 21)
const getBustCards = () => {
  const tenVal1 = ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)];
  const tenVal2 = ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)];
  const card1 = { suit: SUITS[Math.floor(Math.random() * 4)], value: tenVal1, idx: VALUES.indexOf(tenVal1) };
  const card2 = { suit: SUITS[Math.floor(Math.random() * 4)], value: tenVal2, idx: VALUES.indexOf(tenVal2) };
  return [card1, card2];
};

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
      <div className="w-24 h-36 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center shadow-2xl border-2 border-blue-600">
        <span className="text-blue-400 text-5xl">?</span>
      </div>
    );
  }
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  return (
    <div className={`w-24 h-36 rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-all hover:scale-105 ${
      isRed ? 'bg-gradient-to-br from-white to-gray-100 text-red-600' : 'bg-gradient-to-br from-white to-gray-100 text-gray-900'
    }`}>
      <span className="font-black text-4xl">{card?.value}</span>
      <span className="text-2xl">{card?.suit}</span>
    </div>
  );
};

export default function BlackjackGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [splitHand, setSplitHand] = useState([]);
  const [activeHand, setActiveHand] = useState(0);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Admin cheats
  const blackjackCheats = state.adminSettings?.gameSettings?.blackjack || {};
  const godMode = state.adminSettings?.godMode;

  const canSplit = playerCards.length === 2 &&
    playerCards[0]?.value === playerCards[1]?.value &&
    splitHand.length === 0 &&
    bet <= state.balance;

  const canDouble = (gamePhase === 'playing' && playerCards.length === 2) ||
    (gamePhase === 'playing_split' && activeHand === 1 && splitHand.length === 2);

  const deal = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    audio.playBet();
    setResult(null);
    setSplitHand([]);
    setActiveHand(0);

    // Admin cheats
    let pCards, dCards;
    if (blackjackCheats.alwaysBlackjack || godMode) {
      pCards = getBlackjackCards();
      dCards = [getCard(), getCard()];
    } else if (blackjackCheats.dealerBust) {
      pCards = [getCard(), getCard()];
      dCards = getBustCards();
    } else {
      pCards = [getCard(), getCard()];
      dCards = [getCard(), getCard()];
    }

    setPlayerCards(pCards);
    setDealerCards(dCards);

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
    if (gamePhase !== 'playing' && gamePhase !== 'playing_split') return;

    const newCard = getCard();

    if (gamePhase === 'playing_split' && activeHand === 1) {
      const newSplit = [...splitHand, newCard];
      setSplitHand(newSplit);
      if (calcValue(newSplit) > 21) {
        setActiveHand(0);
        setGamePhase('playing');
      }
    } else {
      const newCards = [...playerCards, newCard];
      setPlayerCards(newCards);
      audio.playClick();

      if (calcValue(newCards) > 21) {
        if (splitHand.length > 0 && activeHand === 0) {
          playDealer();
        } else {
          endGame('bust', newCards, dealerCards, 0);
        }
      }
    }
  }, [gamePhase, playerCards, dealerCards, splitHand, activeHand]);

  const stand = useCallback(() => {
    if (gamePhase !== 'playing' && gamePhase !== 'playing_split') return;

    if (gamePhase === 'playing_split' && activeHand === 1) {
      setActiveHand(0);
      setGamePhase('playing');
    } else {
      playDealer();
    }
  }, [gamePhase, activeHand]);

  const double = useCallback(() => {
    if (!canDouble || bet > state.balance) return;
    if (!placeBet(bet, 'blackjack')) return;

    const newCard = getCard();
    const newCards = [...playerCards, newCard];
    setPlayerCards(newCards);
    setBet(bet * 2);
    audio.playBet();

    if (calcValue(newCards) > 21) {
      endGame('bust', newCards, dealerCards, 0);
    } else {
      playDealer();
    }
  }, [canDouble, gamePhase, playerCards, dealerCards, bet, state.balance, placeBet]);

  const split = useCallback(() => {
    if (!canSplit) return;
    if (!placeBet(bet, 'blackjack')) return;

    const card1 = playerCards[0];
    const card2 = playerCards[1];

    setPlayerCards([card1, getCard()]);
    setSplitHand([card2, getCard()]);
    setActiveHand(1);
    setGamePhase('playing_split');
    audio.playBet();
  }, [canSplit, playerCards, bet, placeBet]);

  const playDealer = () => {
    setGamePhase('dealer');
    let dCards = [...dealerCards];

    const play = () => {
      if (calcValue(dCards) < 17) {
        dCards = [...dCards, getCard()];
        setDealerCards([...dCards]);
        setTimeout(play, state.settings.fastMode ? 200 : 400);
      } else {
        evaluateResults(dCards);
      }
    };
    setTimeout(play, state.settings.fastMode ? 200 : 400);
  };

  const evaluateResults = (dCards) => {
    const dVal = calcValue(dCards);
    const pVal = calcValue(playerCards);

    let outcome, mult;

    if (dVal > 21) {
      outcome = 'win';
      mult = 2;
    } else if (dVal > pVal || pVal > 21) {
      outcome = 'lose';
      mult = 0;
    } else if (pVal > dVal) {
      outcome = 'win';
      mult = 2;
    } else {
      outcome = 'push';
      mult = 1;
    }

    endGame(outcome, playerCards, dCards, mult);
  };

  const endGame = (outcome, pCards, dCards, mult) => {
    setGamePhase('ended');
    const winAmount = bet * mult;
    const profit = winAmount - bet;

    setResult({ outcome, mult, profit, pVal: calcValue(pCards), dVal: calcValue(dCards) });
    setHistory(h => [{ outcome, mult: mult.toFixed(1) }, ...h.slice(0, 4)]);

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
    setSplitHand([]);
    setActiveHand(0);
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
  const sVal = calcValue(splitHand);

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0d1a0d] rounded-2xl p-6 flex flex-col">
        {/* Dealer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg text-gray-400 uppercase font-bold">Dealer</span>
            {(gamePhase === 'ended' || gamePhase === 'dealer') && (
              <span className="bg-black/60 px-4 py-2 rounded-full text-2xl font-black text-white">{calcValue(dealerCards)}</span>
            )}
          </div>
          <div className="flex gap-4">
            {dealerCards.length > 0 ? (
              dealerCards.map((c, i) => (
                <Card key={i} card={c} hidden={i === 1 && gamePhase === 'playing'} />
              ))
            ) : (
              <div className="w-24 h-36 border-3 border-dashed border-gray-700 rounded-2xl" />
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-4 rounded-2xl my-4 ${
            result.outcome === 'blackjack' ? 'bg-gradient-to-r from-yellow-900/60 to-amber-900/60 border-2 border-yellow-500/50' :
            result.outcome === 'win' ? 'bg-gradient-to-r from-green-900/60 to-emerald-900/60 border-2 border-green-500/50' :
            result.outcome === 'push' ? 'bg-gray-700/60 border-2 border-gray-500/50' :
            'bg-gradient-to-r from-red-900/60 to-rose-900/60 border-2 border-red-500/50'
          }`}>
            <span className={`text-3xl font-black ${
              result.outcome === 'blackjack' ? 'text-yellow-400' :
              result.outcome === 'win' ? 'text-green-400' :
              result.outcome === 'push' ? 'text-gray-300' : 'text-red-400'
            }`}>
              {result.outcome === 'blackjack' ? `🎰 BLACKJACK! +$${result.profit.toFixed(2)}` :
               result.outcome === 'win' ? `WIN! +$${result.profit.toFixed(2)}` :
               result.outcome === 'push' ? 'PUSH' :
               result.outcome === 'bust' ? `BUST! -$${bet.toFixed(2)}` :
               `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* Player */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex gap-8">
            {/* Main Hand */}
            <div className={`flex flex-col items-center ${activeHand === 0 && gamePhase.includes('playing') ? 'ring-4 ring-cyan-500/50 rounded-2xl p-3' : ''}`}>
              <div className="flex gap-3">
                {playerCards.length > 0 ? (
                  playerCards.map((c, i) => <Card key={i} card={c} />)
                ) : (
                  <div className="w-24 h-36 border-3 border-dashed border-gray-700 rounded-2xl" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-lg text-gray-400 uppercase font-bold">{splitHand.length > 0 ? 'Hand 1' : 'You'}</span>
                {pVal > 0 && <span className={`bg-black/60 px-4 py-2 rounded-full text-2xl font-black ${pVal > 21 ? 'text-red-400' : 'text-white'}`}>{pVal}</span>}
              </div>
            </div>

            {/* Split Hand */}
            {splitHand.length > 0 && (
              <div className={`flex flex-col items-center ${activeHand === 1 ? 'ring-4 ring-cyan-500/50 rounded-2xl p-3' : ''}`}>
                <div className="flex gap-3">
                  {splitHand.map((c, i) => <Card key={i} card={c} />)}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-lg text-gray-400 uppercase font-bold">Hand 2</span>
                  <span className={`bg-black/60 px-4 py-2 rounded-full text-2xl font-black ${sVal > 21 ? 'text-red-400' : 'text-white'}`}>{sVal}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-5 flex-1 flex flex-col gap-4">
          {/* Bet Amount */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={gamePhase !== 'betting'}
                className="w-full bg-black/50 border-2 border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button onClick={() => handleBetChange(1)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">MAX</button>
            </div>
          </div>

          {/* Quick Bets */}
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50, 100, 250, 500].map(v => (
              <button
                key={v}
                onClick={() => handleBetChange(v)}
                disabled={gamePhase !== 'betting'}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${bet === v ? 'bg-green-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                ${v}
              </button>
            ))}
          </div>

          {/* Payouts */}
          <div className="bg-black/40 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">🎰 Blackjack</span>
              <span className="text-yellow-400 font-bold">3:2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Win</span>
              <span className="text-green-400 font-bold">1:1</span>
            </div>
          </div>

          {/* Actions */}
          {gamePhase === 'betting' ? (
            <button
              onClick={deal}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-2xl disabled:opacity-50 mt-auto shadow-lg shadow-green-500/30"
            >
              DEAL
            </button>
          ) : gamePhase === 'playing' || gamePhase === 'playing_split' ? (
            <div className="flex flex-col gap-3 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={hit} className="py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl">
                  HIT
                </button>
                <button onClick={stand} className="py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xl">
                  STAND
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {canDouble && (
                  <button onClick={double} className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black">
                    DOUBLE
                  </button>
                )}
                {canSplit && (
                  <button onClick={split} className="py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black">
                    SPLIT
                  </button>
                )}
              </div>
            </div>
          ) : gamePhase === 'dealer' ? (
            <button disabled className="w-full py-5 rounded-xl bg-gray-700 text-gray-400 font-black text-xl mt-auto">
              DEALER DRAWING...
            </button>
          ) : (
            <button onClick={newGame} className="w-full py-5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-2xl mt-auto shadow-lg shadow-pink-500/30">
              NEW GAME
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="flex justify-center gap-2">
              {history.map((h, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg text-sm font-bold group relative cursor-help transition-all hover:scale-105 ${
                  h.outcome === 'blackjack' || h.outcome === 'win' ? 'bg-green-900/50 text-green-400' :
                  h.outcome === 'push' ? 'bg-gray-700/50 text-gray-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {h.mult}x
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 w-48 z-10 text-center whitespace-normal font-normal">
                    {OUTCOME_EXPLANATIONS[h.outcome] || h.outcome}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
