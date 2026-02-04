import {
    ArrowUpDown,
    Bomb,
    Building2,
    Cherry,
    Coins,
    Dice5,
    Dices,
    Eraser,
    Files,
    Flame, Gamepad2,
    Gem,
    Hash,
    LayoutGrid,
    Rocket,
    Spade,
    Target
} from 'lucide-react';
import { useCasino } from '../context/CasinoContext';

// Lucide Icons mapping - matches App.tsx sidebar icons
const Icons = {
  blackjack: <Spade className="w-8 h-8" />,
  slots: <Cherry className="w-8 h-8" />,
  dice: <Dices className="w-8 h-8" />,
  mines: <Bomb className="w-8 h-8" />,
  crash: <Rocket className="w-8 h-8" />,
  scratchcard: <Eraser className="w-8 h-8" />,
  hilo: <ArrowUpDown className="w-8 h-8" />,
  tower: <Building2 className="w-8 h-8" />,
  limbo: <Target className="w-8 h-8" />,
  coinflip: <Coins className="w-8 h-8" />,
  keno: <LayoutGrid className="w-8 h-8" />,
  baccarat: <Gem className="w-8 h-8" />,
  dragontiger: <Flame className="w-8 h-8" />,
  videopoker: <Gamepad2 className="w-8 h-8" />,
  sicbo: <Dice5 className="w-8 h-8" />,
  threecardpoker: <Files className="w-8 h-8" />,
  war: <ArrowUpDown className="w-8 h-8" />,
  tictactoe: <Hash className="w-8 h-8" />,
};

const GAMES_INFO = [
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer by getting closer to 21', edge: '0.5%', icon: 'blackjack' },
  { id: 'dice', name: 'Dice', description: 'Roll over or under your target', edge: '2%', icon: 'dice' },
  { id: 'slots', name: 'Slots', description: 'Spin reels for matching symbols', edge: '3-5%', icon: 'slots' },
  { id: 'crash', name: 'Crash', description: 'Cash out before the multiplier crashes', edge: '3%', icon: 'crash' },
  { id: 'mines', name: 'Mines', description: 'Find gems while avoiding mines', edge: '3%', icon: 'mines' },
  { id: 'scratchcards', name: 'Scratch Cards', description: 'Scratch to reveal matching symbols', edge: '3%', icon: 'scratchcard' },
  { id: 'hilo', name: 'Hi-Lo', description: 'Predict the next card high or low', edge: '3%', icon: 'hilo' },
  { id: 'tower', name: 'Tower', description: 'Climb the tower without hitting traps', edge: '3%', icon: 'tower' },
  { id: 'limbo', name: 'Limbo', description: 'Hit your target multiplier', edge: '2%', icon: 'limbo' },
  { id: 'coinflip', name: 'Coin Flip', description: 'Simple 50/50 heads or tails', edge: '2%', icon: 'coinflip' },
  { id: 'keno', name: 'Keno', description: 'Pick numbers and match the draw', edge: '2%', icon: 'keno' },
  { id: 'war', name: 'War', description: 'Higher card wins in this classic game', edge: '2.5%', icon: 'war' },
  { id: 'tictactoe', name: 'Tic Tac Toe', description: 'Beat the AI in classic game', edge: '5%', icon: 'tictactoe' },
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
      <div className="game-card p-8 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 animate-fade-in-up hover-lift">
        <h1 className="text-4xl font-black text-white mb-2 animate-slide-in-left">
          Welcome to <span className="text-cyan-400 animate-pulse-slow">Offline Casino</span>
        </h1>
        <p className="text-gray-300 text-lg animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          19 casino games with virtual currency. No real money, just fun!
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="bg-black/30 rounded-xl px-6 py-3 hover-scale transition-smooth stagger-item animate-scale-in">
            <div className="text-gray-400 text-xs uppercase">Balance</div>
            <div className="text-3xl font-black text-green-400 animate-bounce-gentle">${state.balance.toLocaleString()}</div>
          </div>
          <div className="bg-black/30 rounded-xl px-6 py-3 hover-scale transition-smooth stagger-item animate-scale-in">
            <div className="text-gray-400 text-xs uppercase">Games Played</div>
            <div className="text-3xl font-black text-cyan-400">{stats.gamesPlayed}</div>
          </div>
          <div className="bg-black/30 rounded-xl px-6 py-3 hover-scale transition-smooth stagger-item animate-scale-in">
            <div className="text-gray-400 text-xs uppercase">Win Rate</div>
            <div className="text-3xl font-black text-yellow-400">{winRate}%</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Total Wins</div>
          <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Total Losses</div>
          <div className="text-2xl font-bold text-red-400">{stats.totalLosses}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Net Profit</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalProfit.toFixed(2)}
          </div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Biggest Win</div>
          <div className="text-2xl font-bold text-yellow-400">${stats.biggestWin.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Biggest Loss</div>
          <div className="text-2xl font-bold text-red-400">${Math.abs(stats.biggestLoss).toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Total Wagered</div>
          <div className="text-2xl font-bold text-cyan-400">${stats.totalWagered.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">Average Bet</div>
          <div className="text-2xl font-bold text-purple-400">${stats.avgBet.toFixed(2)}</div>
        </div>
        <div className="game-card p-4 text-center card-hover stagger-item animate-fade-in-up">
          <div className="text-gray-400 text-xs uppercase">ROI</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalWagered > 0 ? ((stats.totalProfit / stats.totalWagered) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4 animate-slide-in-left">Choose a Game</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {GAMES_INFO.map((game, index) => (
            <button
              key={game.id}
              onClick={() => onSelectGame && onSelectGame(game.id)}
              className="game-card p-4 text-left hover:border-cyan-500/50 transition-smooth card-hover group stagger-item animate-scale-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="text-cyan-400 mb-2 group-hover:animate-bounce-gentle transition-transform duration-300">
                {Icons[game.icon]}
              </div>
              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                {game.name}
              </div>
              <div className="text-sm text-gray-400 mt-1">{game.description}</div>
              <div className="text-xs text-gray-500 mt-2">House Edge: {game.edge}</div>
              {gameStats[game.id] && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs animate-fade-in">
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
        <div className="game-card p-6 animate-fade-in-up hover-lift">
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
                  <tr key={i} className="border-b border-gray-800 hover:bg-white/5 transition-smooth stagger-item animate-fade-in">
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
      <div className="game-card p-6 bg-gradient-to-br from-gray-900 to-gray-800 animate-fade-in-up hover-lift">
        <h2 className="text-xl font-bold text-white mb-4">About Offline Casino</h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-300">
          <div className="animate-slide-in-left">
            <h3 className="font-bold text-cyan-400 mb-2">Features</h3>
            <ul className="space-y-1 text-sm">
              <li className="stagger-item animate-fade-in-up">- 19 unique casino games</li>
              <li className="stagger-item animate-fade-in-up">- Play with virtual currency</li>
              <li className="stagger-item animate-fade-in-up">- No registration required</li>
              <li className="stagger-item animate-fade-in-up">- Works offline</li>
              <li className="stagger-item animate-fade-in-up">- Progress saves locally</li>
              <li className="stagger-item animate-fade-in-up">- Provably fair games</li>
            </ul>
          </div>
          <div className="animate-slide-in-right">
            <h3 className="font-bold text-cyan-400 mb-2">Disclaimer</h3>
            <p className="text-sm">
              This is a free entertainment app. No real money is involved.
              This app is for educational and entertainment purposes only.
              If you or someone you know has a gambling problem, please seek help.
            </p>
          </div>
        </div>

        {/* License & Copyright */}
        <div className="mt-6 pt-4 border-t border-gray-700 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-gray-500">
            <div>
              © 2025-{new Date().getFullYear()} <a href="https://piotrunius.github.io/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">Piotrunius</a>. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span>Licensed under</span>
              <a
                href="https://github.com/Piotrunius/OfflineCasino/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold hover:bg-cyan-500/30 transition-smooth hover-scale"
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
