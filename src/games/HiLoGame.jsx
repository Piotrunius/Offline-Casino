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
  higher: { label: 'HIGHER ↑', calc: (curr, next) => next.numValue > curr.numValue, color: 'green' },
  lower: { label: 'LOWER ↓', calc: (curr, next) => next.numValue < curr.numValue, color: 'red' },
  same: { label: 'SAME =', calc: (curr, next) => next.numValue === curr.numValue, mult: 12, color: 'yellow' },
  red: { label: 'RED ♥♦', calc: (_, next) => next.suit === '♥' || next.suit === '♦', color: 'red' },
  black: { label: 'BLACK ♠♣', calc: (_, next) => next.suit === '♠' || next.suit === '♣', color: 'gray' },
  hearts: { label: '♥ Hearts', calc: (_, next) => next.suit === '♥', mult: 4, color: 'red' },
  diamonds: { label: '♦ Diamonds', calc: (_, next) => next.suit === '♦', mult: 4, color: 'red' },
  spades: { label: '♠ Spades', calc: (_, next) => next.suit === '♠', mult: 4, color: 'gray' },
  clubs: { label: '♣ Clubs', calc: (_, next) => next.suit === '♣', mult: 4, color: 'gray' },
  odd: { label: 'ODD', calc: (_, next) => next.numValue % 2 === 1, color: 'cyan' },
  even: { label: 'EVEN', calc: (_, next) => next.numValue % 2 === 0, color: 'purple' },
  face: { label: 'FACE (J/Q/K)', calc: (_, next) => next.numValue >= 11, mult: 4, color: 'orange' },
  ace: { label: 'ACE', calc: (_, next) => next.numValue === 1, mult: 13, color: 'pink' },
  number: { label: '2-10', calc: (_, next) => next.numValue >= 2 && next.numValue <= 10, mult: 1.5, color: 'blue' }
};

const Card = ({ card, size = 'large' }) => {
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  const sizeClasses = size === 'large' ? 'w-32 h-48' : 'w-14 h-20';
  const textSize = size === 'large' ? 'text-6xl' : 'text-lg';
  const suitSize = size === 'large' ? 'text-4xl' : 'text-sm';

  if (!card) {
    return (
      <div className={`${sizeClasses} rounded-2xl bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center shadow-2xl border-2 border-blue-700`}>
        <span className="text-blue-400 text-6xl">?</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-all hover:scale-105 ${
      isRed ? 'bg-gradient-to-br from-white to-gray-100 text-red-600' : 'bg-gradient-to-br from-white to-gray-100 text-gray-900'
    }`}>
      <span className={`font-black ${textSize}`}>{card.value}</span>
      <span className={suitSize}>{card.suit}</span>
    </div>
  );
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
  const [streak, setStreak] = useState(0);

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

    setTimeout(() => {
      setNextCard(newCard);
      setPlaying(false);

      const winAmount = won ? bet * mult : 0;
      setResult({ won, mult: won ? mult : 0, profit: won ? winAmount - bet : -bet });
      setHistory(h => [{ card: newCard, won }, ...h.slice(0, 7)]);
      setCurrentCard(newCard);
      setStreak(won ? streak + 1 : 0);

      if (won) {
        addWin(winAmount, bet, 'hilo', mult);
        audio.playWin();
      } else {
        addWin(0, bet, 'hilo', 0);
        audio.playLose();
      }
    }, state.settings.fastMode ? 300 : 600);
  }, [playing, bet, state.balance, betType, currentCard, state.settings.fastMode, placeBet, addWin, streak]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const isRed = (suit) => suit === '♥' || suit === '♦';

  const colorClasses = {
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    yellow: 'bg-yellow-600 text-black',
    gray: 'bg-gray-700 text-white',
    cyan: 'bg-cyan-600 text-white',
    purple: 'bg-purple-600 text-white',
    orange: 'bg-orange-600 text-white',
    pink: 'bg-pink-600 text-white',
    blue: 'bg-blue-600 text-white'
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#15081a] rounded-2xl p-6 flex flex-col items-center justify-center">
        {/* Streak */}
        {streak > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-full font-black text-lg">
            🔥 {streak} STREAK
          </div>
        )}

        {/* Cards */}
        <div className="flex gap-8 items-center">
          {/* Current Card */}
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 uppercase mb-3">Current Card</span>
            <Card card={currentCard} size="large" />
          </div>

          <span className="text-5xl text-gray-600 font-black">→</span>

          {/* Next Card */}
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 uppercase mb-3">Next Card</span>
            <Card card={nextCard} size="large" />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 text-center py-4 px-8 rounded-2xl ${result.won ? 'bg-green-900/60 border-2 border-green-500/50' : 'bg-red-900/60 border-2 border-red-500/50'}`}>
            <span className={`text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN ${result.mult}x → +$${result.profit.toFixed(2)}` : `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 mt-6">
            {history.map((h, i) => (
              <div key={i} className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center text-sm font-bold ${
                isRed(h.card.suit) ? 'bg-white text-red-600' : 'bg-white text-gray-900'
              } ${h.won ? 'ring-3 ring-green-500' : 'ring-3 ring-red-500'}`}>
                <span className="font-black">{h.card.value}</span>
                <span className="text-xs">{h.card.suit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-5 flex-1 flex flex-col gap-4">
          {/* Main Predictions */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Main Prediction</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['higher', 'lower', 'same'].map(key => (
                <button key={key} onClick={() => !playing && setBetType(key)} disabled={playing}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    betType === key ? colorClasses[BET_TYPES[key].color] + ' scale-105 shadow-lg' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {BET_TYPES[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Bets */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Color</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['red', 'black'].map(key => (
                <button key={key} onClick={() => !playing && setBetType(key)} disabled={playing}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    betType === key ? colorClasses[BET_TYPES[key].color] + ' scale-105 shadow-lg' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {BET_TYPES[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* Suit Bets */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Suits (4x)</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['hearts', 'diamonds', 'spades', 'clubs'].map(key => (
                <button key={key} onClick={() => !playing && setBetType(key)} disabled={playing}
                  className={`py-2 rounded-lg text-lg font-bold transition-all ${
                    betType === key ? (key === 'hearts' || key === 'diamonds' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white ring-2 ring-white') + ' scale-105' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {key === 'hearts' ? '♥' : key === 'diamonds' ? '♦' : key === 'spades' ? '♠' : '♣'}
                </button>
              ))}
            </div>
          </div>

          {/* Special Bets */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Special</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['odd', 'even', 'face', 'ace'].map(key => (
                <button key={key} onClick={() => !playing && setBetType(key)} disabled={playing}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    betType === key ? colorClasses[BET_TYPES[key].color] + ' scale-105' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {BET_TYPES[key].label}
                  {BET_TYPES[key].mult && <span className="text-green-400 ml-1">{BET_TYPES[key].mult}x</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={playing}
                className="w-full bg-black/50 border-2 border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-xl font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-2 text-sm font-bold rounded-lg">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-2 text-sm font-bold rounded-lg">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-2 text-sm font-bold rounded-lg">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-2 text-sm font-bold rounded-lg">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/40 rounded-xl p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-cyan-400 font-black text-lg">{getMultiplier()}x</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Potential Win</span>
              <span className="text-green-400 font-black text-lg">${(bet * parseFloat(getMultiplier())).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={play}
            disabled={playing || bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xl disabled:opacity-50 mt-auto shadow-lg shadow-pink-500/30"
          >
            {playing ? 'DRAWING...' : 'DRAW CARD'}
          </button>
        </div>
      </div>
    </div>
  );
}
