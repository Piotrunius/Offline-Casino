export const GAME_INFO = {
  dice: {
    name: 'Dice',
    emoji: '🎲',
    description: 'A classic probability game where you predict if a randomly generated number (1-100) will be higher, lower, equal to, or within a range of your chosen target.',
    houseEdge: '2%',
    maxMultiplier: '98x',
    rules: [
      'Choose your prediction type: Under, Over, Exact, or Range',
      'Set your target number (1-99)',
      'A random number from 1-100 is rolled',
      'Win if your prediction matches the result',
      'Multiplier is calculated based on probability'
    ],
    history: 'Dice gambling dates back to ancient civilizations. The Egyptians used knucklebones as early as 3000 BCE.',
    strategy: 'Lower win chances = higher multipliers. Balance risk vs reward based on your bankroll.'
  },
  mines: {
    name: 'Mines',
    emoji: '💣',
    description: 'Navigate a grid filled with hidden gems and mines. Each revealed gem increases your multiplier, but hit a mine and lose everything!',
    houseEdge: '3%',
    maxMultiplier: 'Variable (depends on grid size and mine count)',
    rules: [
      'Select grid size (3x3 to 6x6) and number of mines',
      'Click tiles to reveal gems or mines',
      'Each gem increases your current multiplier',
      'Cash out anytime to secure your winnings',
      'Hit a mine and lose your bet'
    ],
    history: 'Inspired by the classic Minesweeper game, casino mines adds gambling mechanics to this beloved puzzle.',
    strategy: 'More mines = higher risk but bigger multipliers. Cash out early for consistent small wins.'
  },
  crash: {
    name: 'Crash',
    emoji: '🚀',
    description: 'Watch the multiplier climb higher and higher. Cash out before it crashes, or lose everything!',
    houseEdge: '4%',
    maxMultiplier: '∞ (Theoretically unlimited)',
    rules: [
      'Place your bet before the round starts',
      'The multiplier starts at 1x and increases',
      'Cash out anytime to lock in your win',
      'The round can crash at any moment',
      'If you don\'t cash out before crash, you lose'
    ],
    history: 'Crash gambling originated in cryptocurrency casinos around 2014, becoming one of the most popular crypto games.',
    strategy: 'Set a target multiplier and stick to it. Many players use auto-cashout for consistency.'
  },
  limbo: {
    name: 'Limbo',
    emoji: '🎯',
    description: 'Set a target multiplier and hope the random result exceeds it. Simple, fast, and thrilling!',
    houseEdge: '2%',
    maxMultiplier: '1000x',
    rules: [
      'Choose your target multiplier',
      'A random multiplier is generated',
      'Win if the result is higher than your target',
      'Higher targets = higher payouts but lower chances'
    ],
    history: 'A simplified version of Crash, Limbo removes the timing element for instant results.',
    strategy: 'Lower targets (1.5x-2x) offer more consistent wins, higher targets for big payouts.'
  },
  coinflip: {
    name: 'Coin Flip',
    emoji: '🪙',
    description: 'The simplest bet - heads or tails. A 50/50 chance for double or nothing!',
    houseEdge: '2%',
    maxMultiplier: '1.96x',
    rules: [
      'Choose heads or tails',
      'The coin is flipped',
      'Correct guess doubles your bet (minus house edge)',
      'Wrong guess loses your bet'
    ],
    history: 'Coin flipping dates back to ancient Rome where it was called "navia aut caput" (ship or head).',
    strategy: 'Pure luck - no strategy can improve your odds. Good for quick, simple bets.'
  },
  tower: {
    name: 'Tower',
    emoji: '🗼',
    description: 'Climb the tower by choosing the safe path. Each correct choice increases your multiplier!',
    houseEdge: '3%',
    maxMultiplier: 'Variable (depends on difficulty)',
    rules: [
      'Choose difficulty (number of tiles per row)',
      'Select one tile per row to climb',
      'Correct tiles let you climb higher',
      'Wrong tile ends the game',
      'Cash out anytime to secure winnings'
    ],
    history: 'Tower combines elements of Mines with a linear progression format.',
    strategy: 'Higher difficulty = bigger multipliers but harder odds. Cash out at comfortable levels.'
  },
  keno: {
    name: 'Keno',
    emoji: '🎱',
    description: 'Pick your lucky numbers and watch the draw. More matches = bigger wins!',
    houseEdge: '5%',
    maxMultiplier: '100x+',
    rules: [
      'Select up to 10 numbers from 1-40',
      '10 winning numbers are randomly drawn',
      'Payouts based on how many of your numbers match',
      'More picks = more chances but lower individual odds'
    ],
    history: 'Keno originated in ancient China and helped fund the Great Wall. It arrived in America in the 1800s.',
    strategy: 'Fewer picks (4-6) offer better odds, more picks (8-10) for jackpot potential.'
  },
  blackjack: {
    name: 'Blackjack',
    emoji: '🃏',
    description: 'The classic card game - beat the dealer by getting closer to 21 without going over!',
    houseEdge: '0.5% (with optimal strategy)',
    maxMultiplier: '2.5x (Blackjack pays 3:2)',
    rules: [
      'Get a hand value closer to 21 than the dealer',
      'Face cards = 10, Aces = 1 or 11',
      'Hit to take another card, Stand to keep your hand',
      'Double Down doubles your bet for one more card',
      'Split pairs into two separate hands',
      'Blackjack (A + 10-value) pays 3:2'
    ],
    history: 'Blackjack evolved from the French game "Vingt-et-Un" (21) in the 1700s.',
    strategy: 'Learn basic strategy charts. Always split Aces and 8s. Never split 10s or 5s.'
  },
  slots: {
    name: 'Slots',
    emoji: '🎰',
    description: 'Spin the reels and match symbols for big wins! Different volatility levels for all play styles.',
    houseEdge: '3-10% (varies by volatility)',
    maxMultiplier: '2500x (5 sevens)',
    rules: [
      'Select grid size and volatility',
      'Spin the reels',
      'Match 3+ symbols on paylines to win',
      'Higher volatility = rarer but bigger wins',
      'Use auto-spin for continuous play'
    ],
    history: 'The first slot machine, the Liberty Bell, was invented by Charles Fey in 1895.',
    strategy: 'Low volatility for steady play, high volatility for jackpot hunting.'
  },
  hilo: {
    name: 'HiLo',
    emoji: '⬆️⬇️',
    description: 'Predict whether the next card will be higher, lower, or the same. Chain correct guesses for bigger wins!',
    houseEdge: '3%',
    maxMultiplier: '13x (guessing Ace)',
    rules: [
      'A card is shown face up',
      'Predict the next card\'s value relative to current',
      'Choose from Higher, Lower, Same, Color, Suit, etc.',
      'Correct predictions multiply your streak',
      'Cash out to secure accumulated winnings'
    ],
    history: 'HiLo is based on traditional "High-Low" card games played in bars and casinos.',
    strategy: 'Use probability - if current card is low, "Higher" is safer. Cash out on streaks.'
  },
  baccarat: {
    name: 'Baccarat',
    emoji: '🎴',
    description: 'Bet on Player, Banker, or Tie. A sophisticated game of chance favored in high-stakes rooms.',
    houseEdge: '1.06% (Banker), 1.24% (Player), 14.36% (Tie)',
    maxMultiplier: '8x (Tie), 12x (Pair bets)',
    rules: [
      'Bet on Player, Banker, or Tie',
      'Two cards dealt to each hand',
      'Hand closest to 9 wins',
      'Face cards and 10s = 0',
      'Third card may be drawn based on rules',
      'Banker bet wins pay 0.95x (5% commission)'
    ],
    history: 'Baccarat originated in Italy in the 1400s and became a favorite of French nobility.',
    strategy: 'Banker bet has best odds. Avoid Tie bet despite high payout - terrible odds.'
  },
  dragontiger: {
    name: 'Dragon Tiger',
    emoji: '🐉',
    description: 'The simplest card game - bet on Dragon or Tiger, and the higher card wins!',
    houseEdge: '3.73%',
    maxMultiplier: '8x (Tie)',
    rules: [
      'Bet on Dragon, Tiger, or Tie',
      'One card dealt to each position',
      'Higher card wins (A=1, K=13)',
      'Tie returns half your bet or pays 8:1 if bet on Tie'
    ],
    history: 'Dragon Tiger originated in Cambodia and is especially popular in Asian casinos.',
    strategy: 'Simple 50/50 game. Avoid Tie bet for consistent play.'
  },
  videopoker: {
    name: 'Video Poker',
    emoji: '🎥',
    description: 'Draw poker meets slot machines. Hold your best cards and draw for winning hands!',
    houseEdge: '0.5-5% (varies by strategy)',
    maxMultiplier: '250x (Royal Flush)',
    rules: [
      '5 cards are dealt face up',
      'Choose which cards to hold',
      'Discarded cards are replaced',
      'Final hand determines payout',
      'Jacks or Better required to win'
    ],
    history: 'Video Poker emerged in the 1970s with the rise of microprocessors.',
    strategy: 'Always hold paying hands. Never break a flush or straight for draws.'
  },
  sicbo: {
    name: 'Sic Bo',
    emoji: '🎲',
    description: 'Ancient Chinese dice game. Bet on the outcome of three dice for various payouts!',
    houseEdge: '2.78-33% (varies by bet)',
    maxMultiplier: '180x (Specific Triple)',
    rules: [
      'Three dice are rolled',
      'Bet on outcomes: Small/Big, specific totals, triples, etc.',
      'Small = 4-10, Big = 11-17 (excluding triples)',
      'Specific triples pay highest but have worst odds'
    ],
    history: 'Sic Bo originated in ancient China and spread via Chinese immigrants worldwide.',
    strategy: 'Small/Big bets have best odds. Combination bets offer good risk/reward.'
  },
  threecardpoker: {
    name: '3 Card Poker',
    emoji: '🃏',
    description: 'Fast-paced poker variant. Beat the dealer with just three cards, or win on Pair Plus!',
    houseEdge: '2.01% (Ante), 2.32% (Pair Plus)',
    maxMultiplier: '40x (Straight Flush)',
    rules: [
      'Place Ante bet (required) and/or Pair Plus (optional)',
      '3 cards dealt to player and dealer',
      'View your cards and choose: Play (match Ante) or Fold',
      'Dealer needs Queen-high to qualify',
      'Pair Plus pays on your hand regardless of dealer'
    ],
    history: 'Invented by Derek Webb in 1994, 3 Card Poker quickly became a casino staple.',
    strategy: 'Play with Q-6-4 or better. Always bet Pair Plus for side action.'
  }
};

export default function GameInfoModal({ gameId, onClose }) {
  const info = GAME_INFO[gameId];
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a10] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-2xl animate-bounce-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{info.emoji}</span>
            <h2 className="text-2xl font-black text-white">{info.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 text-gray-400 hover:text-white flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed">{info.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase mb-1">House Edge</div>
            <div className="text-xl font-bold text-cyan-400">{info.houseEdge}</div>
          </div>
          <div className="bg-black/40 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase mb-1">Max Multiplier</div>
            <div className="text-xl font-bold text-green-400">{info.maxMultiplier}</div>
          </div>
        </div>

        {/* Rules */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            📋 Rules
          </h3>
          <ul className="space-y-2">
            {info.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-400">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* History */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            📜 History
          </h3>
          <p className="text-gray-400 leading-relaxed">{info.history}</p>
        </div>

        {/* Strategy */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
            💡 Strategy Tips
          </h3>
          <p className="text-gray-300">{info.strategy}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:from-cyan-500 hover:to-blue-500"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
