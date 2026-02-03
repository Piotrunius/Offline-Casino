import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCard = () => ({
  suit: SUITS[Math.floor(Math.random() * 4)],
  value: VALUES[Math.floor(Math.random() * 13)],
  numValue: Math.floor(Math.random() * 13) + 1
});

const BET_TYPES = {
  higher: { label: 'HIGHER', calc: (curr, next) => next.numValue > curr.numValue },
  lower: { label: 'LOWER', calc: (curr, next) => next.numValue < curr.numValue },
  same: { label: 'SAME', calc: (curr, next) => next.numValue === curr.numValue, mult: 12 },
  red: { label: 'RED ♥♦', calc: (_, next) => next.suit === '♥' || next.suit === '♦' },
  black: { label: 'BLACK ♠♣', calc: (_, next) => next.suit === '♠' || next.suit === '♣' },
  hearts: { label: '♥', calc: (_, next) => next.suit === '♥', mult: 4 },
  diamonds: { label: '♦', calc: (_, next) => next.suit === '♦', mult: 4 },
  spades: { label: '♠', calc: (_, next) => next.suit === '♠', mult: 4 },
  clubs: { label: '♣', calc: (_, next) => next.suit === '♣', mult: 4 },
  odd: { label: 'ODD', calc: (_, next) => next.numValue % 2 === 1 },
  even: { label: 'EVEN', calc: (_, next) => next.numValue % 2 === 0 },
  face: { label: 'FACE', calc: (_, next) => next.numValue >= 11, mult: 4 },
  ace: { label: 'ACE', calc: (_, next) => next.numValue === 1, mult: 13 }
};

export default function HiLoGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [currentCard, setCurrentCard] = useState(getCard());
  const [nextCard, setNextCard] = useState(null);
  const [betType, setBetType] = useState('higher');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const getMultiplier = () => {
    if (BET_TYPES[betType].mult) return BET_TYPES[betType].mult;
    if (betType === 'higher') {
      const cardsAbove = 13 - currentCard.numValue;
      return cardsAbove > 0 ? (13 / cardsAbove * 0.97).toFixed(2) : 13;
    }
    if (betType === 'lower') {
      const cardsBelow = currentCard.numValue - 1;
      return cardsBelow > 0 ? (13 / cardsBelow * 0.97).toFixed(2) : 13;
    }
    return 2;
  };

  const play = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'hilo')) return;

    setPlaying(true);
    setResult(null);
    setNextCard(null);
    audio.playBet();

    const newCard = getCard();
    const mult = parseFloat(getMultiplier());
    const won = BET_TYPES[betType].calc(currentCard, newCard);

    // Animate
    setTimeout(() => {
      setNextCard(newCard);
      setPlaying(false);

      const winAmount = won ? bet * mult : 0;
      setResult({ won, mult: won ? mult : 0, profit: won ? winAmount - bet : -bet });
      setHistory(h => [{ card: newCard, won }, ...h.slice(0, 4)]);
      setCurrentCard(newCard);

      if (won) {
        addWin(winAmount, bet, 'hilo', mult);
        audio.playWin();
      } else {
        addWin(0, bet, 'hilo', 0);
        audio.playLose();
      }
    }, state.settings.fastMode ? 300 : 600);
  }, [playing, bet, state.balance, betType, currentCard, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const isRed = (suit) => suit === '♥' || suit === '♦';

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-4 flex flex-col items-center justify-center">
        {/* Cards */}
        <div className="flex gap-6 items-center">
          {/* Current Card */}
          <div className={`w-24 h-36 rounded-xl flex flex-col items-center justify-center text-4xl font-black shadow-xl ${
            isRed(currentCard.suit) ? 'bg-white text-red-600' : 'bg-white text-gray-900'
          }`}>
            <span>{currentCard.value}</span>
            <span className="text-2xl">{currentCard.suit}</span>
          </div>

          <span className="text-3xl text-gray-600">→</span>

          {/* Next Card */}
          <div className={`w-24 h-36 rounded-xl flex flex-col items-center justify-center text-4xl font-black shadow-xl transition-all ${
            nextCard
              ? isRed(nextCard.suit) ? 'bg-white text-red-600' : 'bg-white text-gray-900'
              : 'bg-gradient-to-br from-blue-900 to-blue-950 text-blue-400'
          }`}>
            {nextCard ? (
              <>
                <span>{nextCard.value}</span>
                <span className="text-2xl">{nextCard.suit}</span>
              </>
            ) : (
              <span className="text-3xl">?</span>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN ${result.mult}x → +$${result.profit.toFixed(2)}` : `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 mt-4">
            {history.map((h, i) => (
              <div key={i} className={`w-10 h-14 rounded flex flex-col items-center justify-center text-sm font-bold ${
                isRed(h.card.suit) ? 'bg-white text-red-600' : 'bg-white text-gray-900'
              } ${h.won ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'}`}>
                <span>{h.card.value}</span>
                <span className="text-xs">{h.card.suit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-2">
          {/* Bet Type */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Prediction</label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button onClick={() => !playing && setBetType('higher')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'higher' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                HIGHER ↑
              </button>
              <button onClick={() => !playing && setBetType('lower')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'lower' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                LOWER ↓
              </button>
              <button onClick={() => !playing && setBetType('same')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'same' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                SAME =
              </button>
              <button onClick={() => !playing && setBetType('red')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'red' ? 'bg-red-700 text-white' : 'bg-gray-800 text-red-400'}`}>
                RED ♥♦
              </button>
              <button onClick={() => !playing && setBetType('black')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'black' ? 'bg-gray-900 text-white ring-1 ring-white' : 'bg-gray-800 text-gray-400'}`}>
                BLACK ♠♣
              </button>
              <button onClick={() => !playing && setBetType('odd')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'odd' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                ODD
              </button>
              <button onClick={() => !playing && setBetType('even')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'even' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                EVEN
              </button>
              <button onClick={() => !playing && setBetType('face')} disabled={playing}
                className={`py-1.5 rounded text-xs font-bold ${betType === 'face' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                FACE
              </button>
            </div>
          </div>

          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-cyan-400 font-bold">{getMultiplier()}x</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Profit</span>
              <span className="text-green-400 font-bold">${(bet * parseFloat(getMultiplier()) - bet).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={play}
            disabled={playing || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {playing ? 'DRAWING...' : 'DRAW CARD'}
          </button>
        </div>
      </div>
    </div>
  );
}
