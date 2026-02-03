import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': 'text-gray-200', '♥': 'text-red-500', '♦': 'text-red-500', '♣': 'text-gray-200' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const WIN_MULTIPLIER = 1.95;
const WAR_MULTIPLIER = 3.8;

export default function WarGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [playing, setPlaying] = useState(false);
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [warMode, setWarMode] = useState(false);
  const [warCards, setWarCards] = useState({ player: [], dealer: [] });

  const godMode = state.adminSettings?.godMode || state.adminSettings?.gameSettings?.war?.alwaysWin;

  const drawCard = useCallback((excludeCards = []) => {
    let card;
    do {
      const suit = SUITS[Math.floor(Math.random() * 4)];
      const rank = RANKS[Math.floor(Math.random() * 13)];
      card = { suit, rank, value: RANK_VALUES[rank] };
    } while (excludeCards.some(c => c.suit === card.suit && c.rank === card.rank));
    return card;
  }, []);

  const drawRiggedCard = useCallback((targetValue, higher, excludeCards = []) => {
    // Draw card higher or lower than target
    const validRanks = RANKS.filter(r =>
      higher ? RANK_VALUES[r] > targetValue : RANK_VALUES[r] < targetValue
    );
    if (validRanks.length === 0) return drawCard(excludeCards);

    const rank = validRanks[Math.floor(Math.random() * validRanks.length)];
    const suit = SUITS[Math.floor(Math.random() * 4)];
    return { suit, rank, value: RANK_VALUES[rank] };
  }, [drawCard]);

  const play = useCallback(async () => {
    if (playing || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'war');
    if (!confirmed) return;

    setPlaying(true);
    setResult(null);
    setWarMode(false);
    setWarCards({ player: [], dealer: [] });
    audio.playBet();

    // Deal cards with animation delay
    await new Promise(r => setTimeout(r, state.settings.fastMode ? 200 : 400));

    const pCard = drawCard();
    setPlayerCard(pCard);

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 200 : 400));

    let dCard;
    if (godMode) {
      // God mode: always lose (draw lower card)
      dCard = drawRiggedCard(pCard.value, false, [pCard]);
    } else {
      dCard = drawCard([pCard]);
    }
    setDealerCard(dCard);

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 300 : 600));

    // Determine winner
    if (pCard.value > dCard.value) {
      // Player wins
      const winAmount = bet * WIN_MULTIPLIER;
      setResult({ outcome: 'win', winAmount, mult: WIN_MULTIPLIER });
      setHistory(h => [{ outcome: 'win', pCard, dCard }, ...h.slice(0, 5)]);
      addWin(winAmount, bet, 'war', WIN_MULTIPLIER);
      audio.playWin();
    } else if (pCard.value < dCard.value) {
      // Dealer wins
      setResult({ outcome: 'lose', winAmount: 0, mult: 0 });
      setHistory(h => [{ outcome: 'lose', pCard, dCard }, ...h.slice(0, 5)]);
      addWin(0, bet, 'war', 0);
      audio.playLose();
    } else {
      // WAR! (tie)
      setWarMode(true);
      setResult({ outcome: 'war', winAmount: 0, mult: 0 });
    }

    setPlaying(false);
  }, [playing, bet, state.balance, state.settings.fastMode, placeBet, drawCard, drawRiggedCard, godMode, addWin]);

  const goToWar = useCallback(async () => {
    if (playing) return;

    // War costs same as original bet
    const confirmed = await placeBet(bet, 'war');
    if (!confirmed) return;

    setPlaying(true);
    audio.playBet();

    // Burn 3 cards each (just visual)
    const burnPlayer = [drawCard(), drawCard(), drawCard()];
    const burnDealer = [drawCard(), drawCard(), drawCard()];

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 300 : 600));
    setWarCards({ player: burnPlayer, dealer: burnDealer });

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 300 : 600));

    // Draw final war cards
    const pWarCard = drawCard([...burnPlayer, ...burnDealer, playerCard, dealerCard]);
    const newPlayerCard = pWarCard;
    setPlayerCard(pWarCard);

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 200 : 400));

    let dWarCard;
    if (godMode) {
      dWarCard = drawRiggedCard(pWarCard.value, false, [...burnPlayer, ...burnDealer, playerCard, dealerCard, pWarCard]);
    } else {
      dWarCard = drawCard([...burnPlayer, ...burnDealer, playerCard, dealerCard, pWarCard]);
    }
    setDealerCard(dWarCard);

    await new Promise(r => setTimeout(r, state.settings.fastMode ? 300 : 600));

    // In war, if player wins they get original bet back + win on war bet
    if (pWarCard.value >= dWarCard.value) {
      // Player wins war (ties go to player in war)
      const winAmount = bet * WAR_MULTIPLIER; // Both bets paid at 1:1 + bonus
      setResult({ outcome: 'win', winAmount, mult: WAR_MULTIPLIER });
      setHistory(h => [{ outcome: 'war-win', pCard: pWarCard, dCard: dWarCard }, ...h.slice(0, 5)]);
      addWin(winAmount, bet, 'war', WAR_MULTIPLIER);
      audio.playWin();
    } else {
      // Dealer wins war
      setResult({ outcome: 'lose', winAmount: 0, mult: 0 });
      setHistory(h => [{ outcome: 'war-lose', pCard: pWarCard, dCard: dWarCard }, ...h.slice(0, 5)]);
      addWin(0, bet, 'war', 0);
      audio.playLose();
    }

    setWarMode(false);
    setPlaying(false);
  }, [playing, bet, placeBet, drawCard, drawRiggedCard, godMode, playerCard, dealerCard, state.settings.fastMode, addWin]);

  const surrender = useCallback(() => {
    // Surrender returns half bet
    const returnAmount = bet * 0.5;
    setResult({ outcome: 'surrender', winAmount: returnAmount, mult: 0.5 });
    setHistory(h => [{ outcome: 'surrender', pCard: playerCard, dCard: dealerCard }, ...h.slice(0, 5)]);
    addWin(returnAmount, bet, 'war', 0.5);
    setWarMode(false);
  }, [bet, playerCard, dealerCard, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const Card = ({ card, faceDown, small }) => {
    if (!card) {
      return (
        <div className={`${small ? 'w-12 h-16' : 'w-28 h-40'} rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center`}>
          <span className="text-gray-600 text-2xl">?</span>
        </div>
      );
    }

    if (faceDown) {
      return (
        <div className={`${small ? 'w-12 h-16' : 'w-28 h-40'} rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700`}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded border border-blue-600 bg-blue-800/50" />
          </div>
        </div>
      );
    }

    return (
      <div className={`${small ? 'w-12 h-16' : 'w-28 h-40'} rounded-xl bg-white border-2 border-gray-300 flex flex-col items-center justify-center shadow-lg`}>
        <span className={`${small ? 'text-lg' : 'text-4xl'} font-black ${SUIT_COLORS[card.suit]}`}>
          {card.rank}
        </span>
        <span className={`${small ? 'text-lg' : 'text-3xl'} ${SUIT_COLORS[card.suit]}`}>
          {card.suit}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0d0a18] rounded-2xl p-6 flex flex-col items-center justify-center relative">
        {/* Result Banner */}
        {result && !warMode && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-center py-3 px-8 rounded-2xl z-10 ${
            result.outcome === 'win'
              ? 'bg-gradient-to-r from-green-900/80 to-emerald-900/80 border border-green-500/50'
              : result.outcome === 'surrender'
              ? 'bg-gradient-to-r from-yellow-900/80 to-amber-900/80 border border-yellow-500/50'
              : 'bg-gradient-to-r from-red-900/80 to-rose-900/80 border border-red-500/50'
          }`}>
            <span className={`text-xl font-black ${
              result.outcome === 'win' ? 'text-green-400' :
              result.outcome === 'surrender' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {result.outcome === 'win' && `WIN ${result.mult.toFixed(2)}x → +$${result.winAmount.toFixed(2)}`}
              {result.outcome === 'lose' && 'DEALER WINS'}
              {result.outcome === 'surrender' && `SURRENDER → $${result.winAmount.toFixed(2)} returned`}
            </span>
          </div>
        )}

        {/* WAR Banner */}
        {warMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center py-3 px-8 rounded-2xl z-10 bg-gradient-to-r from-orange-900/80 to-red-900/80 border border-orange-500/50 animate-pulse">
            <span className="text-2xl font-black text-orange-400">⚔️ WAR! ⚔️</span>
          </div>
        )}

        {/* Cards Area */}
        <div className="flex items-center justify-center gap-16">
          {/* Player Side */}
          <div className="text-center">
            <div className="text-sm text-cyan-400 font-bold mb-4 uppercase tracking-wider">Your Card</div>
            <Card card={playerCard} />
            {playerCard && (
              <div className="mt-2 text-lg font-bold text-white">{playerCard.rank} of {playerCard.suit}</div>
            )}
          </div>

          {/* VS */}
          <div className="text-4xl font-black text-gray-600">VS</div>

          {/* Dealer Side */}
          <div className="text-center">
            <div className="text-sm text-orange-400 font-bold mb-4 uppercase tracking-wider">Dealer Card</div>
            <Card card={dealerCard} />
            {dealerCard && (
              <div className="mt-2 text-lg font-bold text-white">{dealerCard.rank} of {dealerCard.suit}</div>
            )}
          </div>
        </div>

        {/* War cards (burned) */}
        {warCards.player.length > 0 && (
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex gap-1">
              {warCards.player.map((_, i) => <Card key={i} faceDown small />)}
            </div>
            <span className="text-gray-500 text-sm">burned</span>
            <div className="flex gap-1">
              {warCards.dealer.map((_, i) => <Card key={i} faceDown small />)}
            </div>
          </div>
        )}

        {/* War Options */}
        {warMode && !playing && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={goToWar}
              disabled={bet > state.balance}
              className="px-8 py-4 rounded-xl font-black text-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/30 transition-all"
            >
              GO TO WAR (${bet})
            </button>
            <button
              onClick={surrender}
              className="px-8 py-4 rounded-xl font-black text-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white transition-all"
            >
              SURRENDER (get ${(bet * 0.5).toFixed(2)})
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 mt-8 flex-wrap justify-center">
            {history.map((h, i) => (
              <span key={i} className={`px-3 py-2 rounded-xl font-bold text-sm ${
                h.outcome === 'win' || h.outcome === 'war-win' ? 'bg-green-900/50 text-green-400' :
                h.outcome === 'surrender' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-red-900/50 text-red-400'
              }`}>
                {h.pCard.rank}{h.pCard.suit} vs {h.dCard.rank}{h.dCard.suit}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-80 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-5 flex-1 flex flex-col gap-4">
          {/* Bet Amount */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Bet Amount</label>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => handleBetChange(bet / 2)} className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 flex-shrink-0">½</button>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(parseFloat(e.target.value) || 1)}
                className="w-full min-w-0 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-center font-bold"
              />
              <button onClick={() => handleBetChange(bet * 2)} className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 flex-shrink-0">2×</button>
            </div>
          </div>

          {/* Payout Info */}
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between text-gray-400">
              <span>Win Payout:</span>
              <span className="text-green-400 font-bold">{WIN_MULTIPLIER}x</span>
            </div>
            <div className="flex justify-between text-gray-400 mt-1">
              <span>War Win:</span>
              <span className="text-orange-400 font-bold">{WAR_MULTIPLIER}x</span>
            </div>
            <div className="flex justify-between text-gray-400 mt-1">
              <span>Potential Win:</span>
              <span className="text-cyan-400 font-bold">${(bet * WIN_MULTIPLIER).toFixed(2)}</span>
            </div>
          </div>

          {/* Play Button */}
          {!warMode && (
            <button
              onClick={play}
              disabled={playing || bet <= 0 || bet > state.balance}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                playing
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              }`}
            >
              {playing ? 'DEALING...' : 'DEAL CARDS'}
            </button>
          )}

          {/* Balance */}
          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Balance</span>
              <span className="text-xl font-black text-green-400">${state.balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
