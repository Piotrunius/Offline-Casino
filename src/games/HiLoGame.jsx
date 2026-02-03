import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const HOUSE_EDGE = 0.03;

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      const numVal = value === 'A' ? 14 : value === 'K' ? 13 : value === 'Q' ? 12 : value === 'J' ? 11 : parseInt(value);
      deck.push({ suit, value, numVal, color: suit === '♥' || suit === '♦' ? 'red' : 'black' });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// EXPANDED bet types with odds calculations
const BET_TYPES = {
  higher: { label: 'Higher', desc: 'Next card higher', getOdds: (val) => (14 - val) / 13 },
  lower: { label: 'Lower', desc: 'Next card lower', getOdds: (val) => (val - 2) / 13 },
  same: { label: 'Same', desc: 'Exact same value', getOdds: () => 3 / 52 },
  red: { label: 'Red', desc: 'Hearts or Diamonds', getOdds: () => 0.5 },
  black: { label: 'Black', desc: 'Spades or Clubs', getOdds: () => 0.5 },
  hearts: { label: '♥', desc: 'Hearts', getOdds: () => 0.25 },
  diamonds: { label: '♦', desc: 'Diamonds', getOdds: () => 0.25 },
  spades: { label: '♠', desc: 'Spades', getOdds: () => 0.25 },
  clubs: { label: '♣', desc: 'Clubs', getOdds: () => 0.25 },
  odd: { label: 'Odd', desc: 'Odd value (A,3,5,7,9,J,K)', getOdds: () => 7/13 },
  even: { label: 'Even', desc: 'Even value (2,4,6,8,10,Q)', getOdds: () => 6/13 },
  face: { label: 'Face', desc: 'J, Q, or K', getOdds: () => 3/13 },
  ace: { label: 'Ace', desc: 'Next is Ace', getOdds: () => 4/52 },
  low: { label: '2-6', desc: 'Value 2-6', getOdds: () => 5/13 },
  mid: { label: '7-10', desc: 'Value 7-10', getOdds: () => 4/13 },
  high: { label: 'J-A', desc: 'Value J-A', getOdds: () => 4/13 },
};

const checkBet = (betType, currentCard, nextCard) => {
  switch (betType) {
    case 'higher': return nextCard.numVal > currentCard.numVal;
    case 'lower': return nextCard.numVal < currentCard.numVal;
    case 'same': return nextCard.numVal === currentCard.numVal;
    case 'red': return nextCard.color === 'red';
    case 'black': return nextCard.color === 'black';
    case 'hearts': return nextCard.suit === '♥';
    case 'diamonds': return nextCard.suit === '♦';
    case 'spades': return nextCard.suit === '♠';
    case 'clubs': return nextCard.suit === '♣';
    case 'odd': return [1, 3, 5, 7, 9, 11, 13, 14].includes(nextCard.numVal);
    case 'even': return [2, 4, 6, 8, 10, 12].includes(nextCard.numVal);
    case 'face': return nextCard.numVal >= 11 && nextCard.numVal <= 13;
    case 'ace': return nextCard.numVal === 14;
    case 'low': return nextCard.numVal >= 2 && nextCard.numVal <= 6;
    case 'mid': return nextCard.numVal >= 7 && nextCard.numVal <= 10;
    case 'high': return nextCard.numVal >= 11;
    default: return false;
  }
};

const Card = ({ card, small }) => (
  <div className={`${small ? 'w-10 h-14' : 'w-20 h-28'} rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg`}>
    <div className={`text-center ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
      <div className={`${small ? 'text-sm' : 'text-2xl'} font-bold`}>{card.value}</div>
      <div className={small ? 'text-lg' : 'text-3xl'}>{card.suit}</div>
    </div>
  </div>
);

export default function HiLoGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(() => Math.floor(state.balance * 0.05) || 10);
  const [deck, setDeck] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedBet, setSelectedBet] = useState('higher');
  const [lastWin, setLastWin] = useState(null);

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'hilo')) return;

    const newDeck = createDeck();
    const firstCard = newDeck.pop();

    setDeck(newDeck);
    setCurrentCard(firstCard);
    setStreak(0);
    setMultiplier(1);
    setPlaying(true);
    setResult(null);
    setLastWin(null);
    audio.playCardDeal();
  }, [bet, state.balance, placeBet]);

  const guess = useCallback(() => {
    if (!playing || deck.length === 0) return;

    const nextCard = deck.pop();
    const correct = checkBet(selectedBet, currentCard, nextCard);

    audio.playCardDeal();

    if (correct) {
      const odds = BET_TYPES[selectedBet].getOdds(currentCard.numVal);
      const betMult = Math.max(1.1, (1 / odds) * 0.95); // 5% house edge on multiplier
      const newMult = multiplier * betMult;
      const newStreak = streak + 1;

      setCurrentCard(nextCard);
      setMultiplier(newMult);
      setStreak(newStreak);
      setDeck([...deck]);
      setLastWin({ betType: selectedBet, mult: betMult });
      audio.playTick();
    } else {
      setPlaying(false);
      setCurrentCard(nextCard);
      addWin(0, bet, 'hilo', 0);
      setResult({ won: false, card: nextCard, profit: -bet });
      setHistory(h => [{ won: false, streak }, ...h.slice(0, 4)]);
      audio.playLose();
    }
  }, [playing, deck, currentCard, selectedBet, multiplier, streak, bet, addWin]);

  const cashout = useCallback(() => {
    if (!playing || multiplier <= 1) return;
    const win = bet * multiplier;
    addWin(win, bet, 'hilo', multiplier);
    setPlaying(false);
    setResult({ won: true, profit: win - bet, mult: multiplier });
    setHistory(h => [{ won: true, streak, mult: multiplier }, ...h.slice(0, 4)]);
    audio.playWin();
  }, [playing, multiplier, bet, streak, addWin]);

  const cardsLeft = deck.length;
  const currentOdds = currentCard ? BET_TYPES[selectedBet].getOdds(currentCard.numVal) : 0;
  const potentialMult = currentOdds > 0 ? Math.max(1.1, (1 / currentOdds) * 0.95) : 1;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-2">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Cards Left */}
        <div className="text-center text-sm text-gray-400 mb-4">
          Cards Left: {cardsLeft} / 52
        </div>

        {/* Current Card */}
        <div className="flex justify-center mb-6">
          {currentCard ? (
            <Card card={currentCard} />
          ) : (
            <div className="w-20 h-28 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
              <span className="text-3xl text-gray-500">?</span>
            </div>
          )}
        </div>

        {/* Multiplier Display */}
        {playing && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400">Current Multiplier</div>
            <div className="text-4xl font-black text-cyan-400">{multiplier.toFixed(2)}x</div>
            <div className="text-sm text-gray-500">Streak: {streak} | Potential: ${(bet * multiplier).toFixed(2)}</div>
            {lastWin && (
              <div className="text-xs text-green-400 mt-1">
                Last: {BET_TYPES[lastWin.betType].label} (+{lastWin.mult.toFixed(2)}x)
              </div>
            )}
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

        {/* Bet Type Selection */}
        {playing && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase mb-2">Select Your Bet</div>

            {/* Main bets row */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['higher', 'lower', 'same'].map(type => (
                <button key={type}
                  onClick={() => setSelectedBet(type)}
                  className={`py-3 rounded-lg font-bold text-sm transition-all ${
                    selectedBet === type
                      ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                  <div>{BET_TYPES[type].label}</div>
                  <div className="text-xs opacity-70">
                    {(BET_TYPES[type].getOdds(currentCard?.numVal || 7) * 100).toFixed(0)}%
                  </div>
                </button>
              ))}
            </div>

            {/* Color bets */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['red', 'black', 'odd', 'even'].map(type => (
                <button key={type}
                  onClick={() => setSelectedBet(type)}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    selectedBet === type
                      ? type === 'red' ? 'bg-red-600 text-white ring-2 ring-red-400' :
                        type === 'black' ? 'bg-gray-900 text-white ring-2 ring-gray-400' :
                        'bg-cyan-600 text-white ring-2 ring-cyan-400'
                      : type === 'red' ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' :
                        type === 'black' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' :
                        'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                  {BET_TYPES[type].label}
                </button>
              ))}
            </div>

            {/* Suit bets */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['hearts', 'diamonds', 'spades', 'clubs'].map(type => (
                <button key={type}
                  onClick={() => setSelectedBet(type)}
                  className={`py-2 rounded-lg font-bold text-lg transition-all ${
                    selectedBet === type
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  style={{ color: selectedBet !== type ? (type === 'hearts' || type === 'diamonds' ? '#ff6666' : '#aaa') : undefined }}>
                  {BET_TYPES[type].label}
                </button>
              ))}
            </div>

            {/* Range bets */}
            <div className="grid grid-cols-4 gap-2">
              {['low', 'mid', 'high', 'face'].map(type => (
                <button key={type}
                  onClick={() => setSelectedBet(type)}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    selectedBet === type
                      ? 'bg-yellow-600 text-white ring-2 ring-yellow-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                  {BET_TYPES[type].label}
                </button>
              ))}
            </div>

            {/* Selected bet info */}
            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-center">
              <div className="text-sm text-gray-300">{BET_TYPES[selectedBet].desc}</div>
              <div className="text-lg font-bold text-cyan-400">
                {(currentOdds * 100).toFixed(0)}% chance → {potentialMult.toFixed(2)}x
              </div>
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
            <button onClick={guess}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-black text-lg">
              BET: {BET_TYPES[selectedBet].label.toUpperCase()} ({potentialMult.toFixed(2)}x)
            </button>
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
        <BetControls bet={bet} setBet={setBet} disabled={playing} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Bet Types</div>
          <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
            {Object.entries(BET_TYPES).slice(0, 8).map(([key, bt]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{bt.label}</span>
                <span className="text-gray-500">{bt.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.won ? `${h.mult?.toFixed(1)}x` : `${h.streak}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
