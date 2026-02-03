import { useCasino } from '../context/CasinoContext';

const GAMES_INFO = [
  { id: 'blackjack', name: 'Blackjack', icon: '🃏', description: 'Beat the dealer by getting closer to 21', edge: '0.5%' },
  { id: 'roulette', name: 'Roulette', icon: '🎡', description: 'European roulette with 0-36', edge: '2.7%' },
  { id: 'slots', name: 'Slots', icon: '🎰', description: '5 unique machines with different paylines', edge: '3-5%' },
  { id: 'crash', name: 'Crash', icon: '📈', description: 'Cash out before the multiplier crashes', edge: '3%' },
  { id: 'plinko', name: 'Plinko', icon: '⚡', description: 'Drop balls through pegs for multipliers', edge: '1-4%' },
  { id: 'mines', name: 'Mines', icon: '💣', description: 'Find gems while avoiding mines', edge: '3%' },
  { id: 'dice', name: 'Dice', icon: '🎲', description: 'Roll over or under your target', edge: '2%' },
  { id: 'hilo', name: 'Hi-Lo', icon: '🔮', description: 'Predict the next card with many bet types', edge: '3%' },
  { id: 'tower', name: 'Tower', icon: '🗼', description: 'Climb the tower without hitting traps', edge: '3%' },
  { id: 'wheel', name: 'Wheel', icon: '🎯', description: 'Spin the wheel for multipliers', edge: '5%' },
  { id: 'limbo', name: 'Limbo', icon: '🎢', description: 'Hit your target multiplier', edge: '2%' },
  { id: 'coinflip', name: 'Coin Flip', icon: '🪙', description: 'Simple 50/50 heads or tails', edge: '0%' },
  { id: 'keno', name: 'Keno', icon: '🎱', description: 'Pick numbers and match the draw', edge: '3-10%' },
];

export default function Dashboard({ onSelectGame }) {
  const { state } = useCasino();

  // Use history with fallback to empty array
  const gameHistory = state.history || [];

  // Calculate stats
  const stats = {
    totalWins: gameHistory.filter(h => h.profit > 0).length,
    totalLosses: gameHistory.filter(h => h.profit <= 0).length,
    totalProfit: gameHistory.reduce((sum, h) => sum + h.profit, 0),
    biggestWin: gameHistory.length > 0 ? Math.max(...gameHistory.map(h => h.profit)) : 0,
    totalWagered: gameHistory.reduce((sum, h) => sum + h.bet, 0),
    gamesPlayed: gameHistory.length,
  };

  const recentGames = gameHistory.slice(0, 10);

  const winRate = stats.gamesPlayed > 0
    ? ((stats.totalWins / stats.gamesPlayed) * 100).toFixed(1)
    : 0;

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
        <div className="flex gap-4 mt-4">
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
      </div>

      {/* Games Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Choose a Game</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {GAMES_INFO.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame && onSelectGame(game.id)}
              className="game-card p-4 text-left hover:border-cyan-500/50 transition-all group"
            >
              <div className="text-4xl mb-2">{game.icon}</div>
              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                {game.name}
              </div>
              <div className="text-sm text-gray-400 mt-1">{game.description}</div>
              <div className="text-xs text-gray-500 mt-2">House Edge: {game.edge}</div>
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
            <h3 className="font-bold text-cyan-400 mb-2">🎮 Features</h3>
            <ul className="space-y-1 text-sm">
              <li>• 13 unique casino games</li>
              <li>• Play with virtual currency</li>
              <li>• No registration required</li>
              <li>• Works offline</li>
              <li>• Progress saves locally</li>
              <li>• Provably fair games</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-cyan-400 mb-2">⚠️ Disclaimer</h3>
            <p className="text-sm">
              This is a free entertainment app. No real money is involved.
              This app is for educational and entertainment purposes only.
              If you or someone you know has a gambling problem, please seek help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
