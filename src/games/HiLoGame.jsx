import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J'];
const HOUSE_EDGE = 0.03;

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, numVal: VALUES.indexOf(value) + 1, color: suit === '♥' || suit === '♦' ? 'red' : 'black' });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getCardMultiplier = (currentVal, nextVal, isHigher) => {
  const diff = Math.abs(nextVal - currentVal);
  const odds = isHigher ? (11 - currentVal) / 10 : (currentVal - 1) / 10;
  if (odds <= 0.1) return 9.0;
  if (odds <= 0.2) return 4.5;
  if (odds <= 0.3) return 3.0;
  if (odds <= 0.4) return 2.25;
  if (odds <= 0.5) return 1.8;
  return 1.4;
};

const Card = ({ card, small }) => (
  <div className={`${small ? 'w-10 h-14' : 'w-16 h-22'} rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg`}>
    <div className={`text-center ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
      <div className={`${small ? 'text-sm' : 'text-xl'} font-bold`}>{card.value}</div>
      <div className={small ? 'text-lg' : 'text-2xl'}>{card.suit}</div>
    </div>
  </div>
);

export default function HiLoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [nextMults, setNextMults] = useState({ hi: 0, lo: 0 });

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'hilo')) return;

    const newDeck = createDeck();
    const firstCard = newDeck.pop();

    const hiMult = getCardMultiplier(firstCard.numVal, 0, true);
    const loMult = getCardMultiplier(firstCard.numVal, 0, false);

    setDeck(newDeck);
    setCurrentCard(firstCard);
    setStreak(0);
    setMultiplier(1);
    setPlaying(true);
    setResult(null);
    setHistory([]);
    setNextMults({ hi: hiMult, lo: loMult });
    audio.playCardDeal();
  }, [bet, state.balance, placeBet]);

  const guess = useCallback((isHigher) => {
    if (!playing || deck.length === 0) return;

    const nextCard = deck.pop();
    const correct = isHigher
      ? nextCard.numVal >= currentCard.numVal
      : nextCard.numVal <= currentCard.numVal;

    audio.playCardDeal();

    if (correct) {
      const gainedMult = isHigher ? nextMults.hi : nextMults.lo;
      const newMult = multiplier * gainedMult;
      const newStreak = streak + 1;

      setHistory(h => [...h, currentCard]);
      setCurrentCard(nextCard);
      setMultiplier(newMult);
      setStreak(newStreak);
      setDeck([...deck]);

      const hiMult = getCardMultiplier(nextCard.numVal, 0, true);
      const loMult = getCardMultiplier(nextCard.numVal, 0, false);
      setNextMults({ hi: hiMult, lo: loMult });
    } else {
      // Lost
      setPlaying(false);
      setHistory(h => [...h, currentCard]);
      setCurrentCard(nextCard);
      addWin(0, bet, 'hilo', 0);
      setResult({ won: false, card: nextCard, profit: -bet });
      audio.playLose();
    }
  }, [playing, deck, currentCard, multiplier, streak, nextMults, bet, addWin]);

  const cashout = useCallback(() => {
    if (!playing || multiplier <= 1) return;
    const win = bet * multiplier;
    addWin(win, bet, 'hilo', multiplier);
    setPlaying(false);
    setResult({ won: true, profit: win - bet, mult: multiplier });
    audio.playWin();
  }, [playing, multiplier, bet, addWin]);

  const cardsLeft = deck.length;

  return (
    <div className="max-w-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-2">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Cards Left */}
        <div className="text-center text-sm text-gray-400 mb-4">
          Cards Left: {cardsLeft} / {VALUES.length * SUITS.length}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-1 mb-4 flex-wrap">
            {history.slice(-8).map((card, i) => (
              <Card key={i} card={card} small />
            ))}
          </div>
        )}

        {/* Current Card */}
        <div className="flex justify-center mb-6">
          {currentCard ? (
            <div className="transform scale-125">
              <Card card={currentCard} />
            </div>
          ) : (
            <div className="w-16 h-22 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
              <span className="text-2xl text-gray-500">?</span>
            </div>
          )}
        </div>

        {/* Multiplier Display */}
        {playing && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400">Current Multiplier</div>
            <div className="text-4xl font-black text-cyan-400">{multiplier.toFixed(2)}x</div>
            <div className="text-sm text-gray-500">Streak: {streak}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `CASHED OUT ${result.mult.toFixed(2)}x` : 'WRONG GUESS'}
            </div>
            <div className="text-lg">
              {result.profit >= 0 ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {/* Controls */}
        {!playing ? (
          <button onClick={start} disabled={bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
            START GAME
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => guess(false)}
                className="py-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-lg">
                <div>LOWER</div>
                <div className="text-sm font-normal opacity-80">{nextMults.lo.toFixed(2)}x</div>
              </button>
              <button onClick={() => guess(true)}
                className="py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-lg">
                <div>HIGHER</div>
                <div className="text-sm font-normal opacity-80">{nextMults.hi.toFixed(2)}x</div>
              </button>
            </div>
            {multiplier > 1 && (
              <button onClick={cashout}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-lg">
                CASHOUT ${(bet * multiplier).toFixed(2)}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={start} buttonText="START" hideButton disabled={playing} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Card Values</div>
          <div className="flex flex-wrap gap-1 text-xs">
            {VALUES.map((v, i) => (
              <span key={v} className="px-2 py-1 bg-gray-800 rounded">
                {v} = {i + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Rules</div>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Guess if next card is higher or lower</li>
            <li>• Equal values count as correct</li>
            <li>• Riskier guesses = higher multiplier</li>
            <li>• Cashout anytime to secure wins</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
