import { useCasino } from '../context/CasinoContext';

// SVG Icons as components
const Icons = {
  blackjack: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  roulette: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  ),
  slots: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M12 4v16M17 4v16" />
    </svg>
  ),
  crash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M3 17l6-6 4 4 8-10" />
      <path d="M17 7h4v4" />
    </svg>
  ),
  plinko: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="4" r="2" />
      <circle cx="8" cy="10" r="1" /><circle cx="16" cy="10" r="1" />
      <circle cx="6" cy="16" r="1" /><circle cx="12" cy="16" r="1" /><circle cx="18" cy="16" r="1" />
      <path d="M12 6l-2 4l2 6" />
    </svg>
  ),
  mines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  dice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  hilo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M12 4l-6 8h12l-6-8z" />
      <path d="M12 20l6-8H6l6 8z" />
    </svg>
  ),
  tower: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M4 20h16M7 20v-8h10v8M9 12V8h6v4M11 8V4h2v4" />
    </svg>
  ),
  wheel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v10l7 7" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  limbo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M3 20l7-14 4 6 7-10" />
    </svg>
  ),
  coinflip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M8 12h8" />
    </svg>
  ),
  keno: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  baccarat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="2" y="4" width="14" height="18" rx="2" />
      <rect x="8" y="2" width="14" height="18" rx="2" />
      <path d="M12 8v8M9 12h6" />
    </svg>
  ),
  dragontiger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M4 8c2-4 6-4 8-2s6 0 8-2"/>
      <path d="M4 16c2 4 6 4 8 2s6 0 8 2"/>
      <circle cx="8" cy="12" r="2"/>
      <circle cx="16" cy="12" r="2"/>
    </svg>
  ),
  videopoker: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="2" y="6" width="6" height="10" rx="1"/>
      <rect x="9" y="6" width="6" height="10" rx="1"/>
      <rect x="16" y="6" width="6" height="10" rx="1"/>
      <path d="M5 18v2M12 18v2M19 18v2"/>
    </svg>
  ),
  sicbo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="2" y="6" width="12" height="12" rx="2"/>
      <rect x="10" y="2" width="12" height="12" rx="2"/>
      <circle cx="16" cy="8" r="1" fill="currentColor"/>
      <circle cx="8" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
  threecardpoker: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="2" y="6" width="7" height="12" rx="1" transform="rotate(-5 5 12)"/>
      <rect x="8" y="5" width="7" height="12" rx="1"/>
      <rect x="14" y="6" width="7" height="12" rx="1" transform="rotate(5 18 12)"/>
    </svg>
  ),
  scratchcard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h2M14 8h2M8 14h2M14 14h2M11 11h2v2h-2z" />
    </svg>
  ),
};

const GAMES_INFO = [
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer by getting closer to 21', edge: '0.5%', icon: 'blackjack' },
  { id: 'dice', name: 'Dice', description: 'Roll over or under your target', edge: '2%', icon: 'dice' },
  { id: 'slots', name: 'Slots', description: 'Spin reels for matching symbols', edge: '3-5%', icon: 'slots' },
  { id: 'crash', name: 'Crash', description: 'Cash out before the multiplier crashes', edge: '3%', icon: 'crash' },
  { id: 'mines', name: 'Mines', description: 'Find gems while avoiding mines', edge: '3%', icon: 'mines' },
  { id: 'plinko', name: 'Plinko', description: 'Drop balls through pegs for multipliers', edge: '3%', icon: 'plinko' },
  { id: 'hilo', name: 'Hi-Lo', description: 'Predict the next card high or low', edge: '3%', icon: 'hilo' },
  { id: 'tower', name: 'Tower', description: 'Climb the tower without hitting traps', edge: '3%', icon: 'tower' },
  { id: 'limbo', name: 'Limbo', description: 'Hit your target multiplier', edge: '2%', icon: 'limbo' },
  { id: 'coinflip', name: 'Coin Flip', description: 'Simple 50/50 heads or tails', edge: '2%', icon: 'coinflip' },
  { id: 'keno', name: 'Keno', description: 'Pick numbers and match the draw', edge: '2%', icon: 'keno' },
  { id: 'horses', name: 'Horse Racing', description: 'Bet on horses and watch them race', edge: '3%', icon: 'coinflip' },
  { id: 'tictactoe', name: 'Tic Tac Toe', description: 'Beat the AI in classic game', edge: '5%', icon: 'keno' },
  { id: 'baccarat', name: 'Baccarat', description: 'Bet on player, banker or tie', edge: '1.06%', icon: 'baccarat' },
  { id: 'dragontiger', name: 'Dragon Tiger', description: 'Bet on dragon or tiger to win', edge: '2.5%', icon: 'dragontiger' },
  { id: 'videopoker', name: 'Video Poker', description: 'Hold cards to make winning hands', edge: '2%', icon: 'videopoker' },
  { id: 'sicbo', name: 'Sicbo', description: 'Bet on three dice outcomes', edge: '2.8%', icon: 'sicbo' },
  { id: 'threecardpoker', name: '3 Card Poker', description: 'Beat dealer with 3 cards', edge: '3.4%', icon: 'threecardpoker' }
];

export default function Dashboard({ onSelectGame }) {
  const { state } = useCasino();

  const gameHistory = state.history || [];

  const stats = {
    totalWins: gameHistory.filter(h => h.profit > 0).length,
    totalLosses: gameHistory.filter(h => h.profit <= 0).length,
    totalProfit: gameHistory.reduce((sum, h) => sum + h.profit, 0),
    biggestWin: gameHistory.length > 0 ? Math.max(...gameHistory.map(h => h.profit)) : 0,
    biggestLoss: gameHistory.length > 0 ? Math.min(...gameHistory.map(h => h.profit)) : 0,
    totalWagered: gameHistory.reduce((sum, h) => sum + h.bet, 0),
    gamesPlayed: gameHistory.length,
    avgBet: gameHistory.length > 0 ? gameHistory.reduce((sum, h) => sum + h.bet, 0) / gameHistory.length : 0,
  };

  const recentGames = gameHistory.slice(0, 10);

  const winRate = stats.gamesPlayed > 0
    ? ((stats.totalWins / stats.gamesPlayed) * 100).toFixed(1)
    : 0;

  // Game-specific stats
  const gameStats = {};
  GAMES_INFO.forEach(g => {
    const games = gameHistory.filter(h => h.game === g.id);
    if (games.length > 0) {
      gameStats[g.id] = {
        played: games.length,
        profit: games.reduce((s, h) => s + h.profit, 0),
        wins: games.filter(h => h.profit > 0).length
      };
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="game-card p-8 bg-gradient-to-r from-cyan-900/50 to-purple-900/50">
        <h1 className="text-4xl font-black text-white mb-2">
          Welcome to <span className="text-cyan-400">Offline Casino</span>
        </h1>
        <p className="text-gray-300 text-lg">
          Play 13 casino games with virtual currency. No real money, just fun!
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="bg-black/30 rounded-xl px-6 py-3">
            <div className="text-gray-400 text-xs uppercase">Balance</div>
            <div className="text-3xl font-black text-green-400">${state.balance.toLocaleString()}</div>
          </div>
          <div className="bg-black/30 rounded-xl px-6 py-3">
            <div className="text-gray-400 text-xs uppercase">Games Played</div>
            <div className="text-3xl font-black text-cyan-400">{stats.gamesPlayed}</div>
          </div>
          <div className="bg-black/30 rounded-xl px-6 py-3">
            <div className="text-gray-400 text-xs uppercase">Win Rate</div>
            <div className="text-3xl font-black text-yellow-400">{winRate}%</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Total Wins</div>
          <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Total Losses</div>
          <div className="text-2xl font-bold text-red-400">{stats.totalLosses}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Net Profit</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalProfit.toFixed(2)}
          </div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Biggest Win</div>
          <div className="text-2xl font-bold text-yellow-400">${stats.biggestWin.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Biggest Loss</div>
          <div className="text-2xl font-bold text-red-400">${Math.abs(stats.biggestLoss).toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Total Wagered</div>
          <div className="text-2xl font-bold text-cyan-400">${stats.totalWagered.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">Average Bet</div>
          <div className="text-2xl font-bold text-purple-400">${stats.avgBet.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-gray-400 text-xs uppercase">ROI</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalWagered > 0 ? ((stats.totalProfit / stats.totalWagered) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Choose a Game</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {GAMES_INFO.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame && onSelectGame(game.id)}
              className="game-card p-4 text-left hover:border-cyan-500/50 transition-all group"
            >
              <div className="text-cyan-400 mb-2">{Icons[game.icon]}</div>
              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                {game.name}
              </div>
              <div className="text-sm text-gray-400 mt-1">{game.description}</div>
              <div className="text-xs text-gray-500 mt-2">House Edge: {game.edge}</div>
              {gameStats[game.id] && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                  <span className="text-gray-500">{gameStats[game.id].played} plays</span>
                  <span className={`ml-2 ${gameStats[game.id].profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gameStats[game.id].profit >= 0 ? '+' : ''}${gameStats[game.id].profit.toFixed(0)}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recent History */}
      {recentGames.length > 0 && (
        <div className="game-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Games</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b border-gray-700">
                  <th className="pb-2">Game</th>
                  <th className="pb-2">Bet</th>
                  <th className="pb-2">Multiplier</th>
                  <th className="pb-2">Profit</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((game, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 capitalize">{game.game}</td>
                    <td className="py-2">${game.bet.toFixed(2)}</td>
                    <td className="py-2">{game.multiplier.toFixed(2)}x</td>
                    <td className={`py-2 font-bold ${game.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {game.profit >= 0 ? '+' : ''}${game.profit.toFixed(2)}
                    </td>
                    <td className="py-2 text-gray-500 text-sm">
                      {new Date(game.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="game-card p-6 bg-gradient-to-br from-gray-900 to-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">About Offline Casino</h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h3 className="font-bold text-cyan-400 mb-2">Features</h3>
            <ul className="space-y-1 text-sm">
              <li>- 15 unique casino games</li>
              <li>- Play with virtual currency</li>
              <li>- No registration required</li>
              <li>- Works offline</li>
              <li>- Progress saves locally</li>
              <li>- Provably fair games</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-cyan-400 mb-2">Disclaimer</h3>
            <p className="text-sm">
              This is a free entertainment app. No real money is involved.
              This app is for educational and entertainment purposes only.
              If you or someone you know has a gambling problem, please seek help.
            </p>
          </div>
        </div>

        {/* License & Copyright */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-gray-500">
            <div>
              © 2025-{new Date().getFullYear()} <a href="https://piotrunius.github.io/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Piotrunius</a>. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span>Licensed under</span>
              <a
                href="https://github.com/Piotrunius/OfflineCasino/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold hover:bg-cyan-500/30"
              >
                MIT License
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
