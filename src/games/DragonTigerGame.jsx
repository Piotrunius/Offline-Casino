import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCard = () => {
  const idx = Math.floor(Math.random() * 13);
  return {
    suit: SUITS[Math.floor(Math.random() * 4)],
    value: VALUES[idx],
    numValue: idx + 1 // A=1, K=13
  };
};

const Card = ({ card, label, color }) => {
  if (!card) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`text-sm font-bold uppercase ${color}`}>{label}</span>
        <div className="w-28 h-40 rounded-2xl border-3 border-dashed border-gray-700 flex items-center justify-center bg-gray-900/50">
          <span className="text-4xl text-gray-700">?</span>
        </div>
      </div>
    );
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-sm font-bold uppercase ${color}`}>{label}</span>
      <div className={`w-28 h-40 rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
        isRed ? 'bg-white text-red-600' : 'bg-white text-gray-900'
      }`}>
        <span className="font-black text-5xl">{card.value}</span>
        <span className="text-3xl mt-1">{card.suit}</span>
      </div>
    </div>
  );
};

export default function DragonTigerGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('dragon'); // dragon, tiger, tie
  const [dragonCard, setDragonCard] = useState(null);
  const [tigerCard, setTigerCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const MULTIPLIERS = { dragon: 2, tiger: 2, tie: 8 };

  const play = useCallback(() => {
    if (bet <= 0 || bet > state.balance || gamePhase !== 'betting') return;
    if (!placeBet(bet, 'dragontiger')) return;

    setResult(null);
    setGamePhase('dealing');
    setDragonCard(null);
    setTigerCard(null);
    audio.playBet();

    const delay = state.settings.fastMode ? 300 : 600;

    // Deal dragon card
    setTimeout(() => {
      const dragon = getCard();
      setDragonCard(dragon);
      audio.playClick();

      // Deal tiger card
      setTimeout(() => {
        const tiger = getCard();
        setTigerCard(tiger);
        audio.playClick();

        // Determine winner
        setTimeout(() => {
          let outcome;
          if (dragon.numValue > tiger.numValue) outcome = 'dragon';
          else if (tiger.numValue > dragon.numValue) outcome = 'tiger';
          else outcome = 'tie';

          const won = outcome === betType;
          const mult = won ? MULTIPLIERS[betType] : 0;
          const winAmount = won ? bet * mult : 0;

          setResult({ outcome, won, mult, profit: winAmount - bet });
          setHistory(h => [{ outcome, won }, ...h.slice(0, 7)]);
          setGamePhase('ended');

          if (won) {
            addWin(winAmount, bet, 'dragontiger', mult);
            audio.playWin();
          } else {
            addWin(0, bet, 'dragontiger', 0);
            audio.playLose();
          }
        }, delay);
      }, delay);
    }, delay);
  }, [bet, state.balance, gamePhase, betType, state.settings.fastMode, placeBet, addWin]);

  const newGame = () => {
    setDragonCard(null);
    setTigerCard(null);
    setGamePhase('betting');
    setResult(null);
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f1520] rounded-2xl p-6 flex flex-col">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent">
            DRAGON vs TIGER
          </h2>
          <p className="text-xs text-gray-500 mt-1">Higher card wins • Ace is lowest</p>
        </div>

        {/* Cards Area */}
        <div className="flex-1 flex items-center justify-center gap-12">
          <Card card={dragonCard} label="Dragon" color="text-red-500" />
          <div className="text-4xl text-gray-600 font-black">VS</div>
          <Card card={tigerCard} label="Tiger" color="text-blue-500" />
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-3 rounded-xl ${
            result.won ? 'bg-green-900/50 border border-green-500/30' : 'bg-red-900/50 border border-red-500/30'
          }`}>
            <span className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.outcome.toUpperCase()} WINS!
              {result.won ? ` +$${result.profit.toFixed(2)}` : ` -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            {history.map((h, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                h.outcome === 'dragon' ? 'bg-red-600 text-white' :
                h.outcome === 'tiger' ? 'bg-blue-600 text-white' :
                'bg-green-600 text-white'
              }`}>
                {h.outcome[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
          {/* Bet Type */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Place Your Bet</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => gamePhase === 'betting' && setBetType('dragon')}
                disabled={gamePhase !== 'betting'}
                className={`py-4 rounded-xl font-black text-sm transition-all ${
                  betType === 'dragon'
                    ? 'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-gray-800 text-red-400 hover:bg-gray-700'
                }`}
              >
                🐉 DRAGON
                <div className="text-xs opacity-70 mt-1">2x</div>
              </button>
              <button
                onClick={() => gamePhase === 'betting' && setBetType('tie')}
                disabled={gamePhase !== 'betting'}
                className={`py-4 rounded-xl font-black text-sm transition-all ${
                  betType === 'tie'
                    ? 'bg-gradient-to-b from-green-500 to-green-700 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-gray-800 text-green-400 hover:bg-gray-700'
                }`}
              >
                🤝 TIE
                <div className="text-xs opacity-70 mt-1">8x</div>
              </button>
              <button
                onClick={() => gamePhase === 'betting' && setBetType('tiger')}
                disabled={gamePhase !== 'betting'}
                className={`py-4 rounded-xl font-black text-sm transition-all ${
                  betType === 'tiger'
                    ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-800 text-blue-400 hover:bg-gray-700'
                }`}
              >
                🐯 TIGER
                <div className="text-xs opacity-70 mt-1">2x</div>
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={gamePhase !== 'betting'}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => handleBetChange(1)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">MAX</button>
            </div>
          </div>

          {/* Potential Win */}
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Potential Win</span>
              <span className="text-green-400 font-black text-lg">${(bet * MULTIPLIERS[betType]).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          {gamePhase === 'betting' ? (
            <button
              onClick={play}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-xl disabled:opacity-50 mt-auto shadow-lg shadow-orange-500/30"
            >
              DEAL CARDS
            </button>
          ) : gamePhase === 'dealing' ? (
            <button disabled className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 font-black text-lg mt-auto">
              DEALING...
            </button>
          ) : (
            <button
              onClick={newGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-xl mt-auto shadow-lg shadow-cyan-500/30"
            >
              NEW GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
