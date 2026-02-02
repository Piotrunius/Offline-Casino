import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useCasino } from '../context/CasinoContext';

const GAMES = [
  { id: 'crash', name: 'Crash', icon: 'Rocket', cat: 'Originals', desc: 'Cash out before crash' },
  { id: 'mines', name: 'Mines', icon: 'Bomb', cat: 'Originals', desc: 'Avoid the bombs' },
  { id: 'dice', name: 'Dice', icon: 'Dices', cat: 'Originals', desc: 'Roll the dice' },
  { id: 'plinko', name: 'Plinko', icon: 'Triangle', cat: 'Originals', desc: 'Drop & collect' },
  { id: 'limbo', name: 'Limbo', icon: 'ArrowUpDown', cat: 'Originals', desc: 'How high can you go' },
  { id: 'tower', name: 'Tower', icon: 'Building2', cat: 'Originals', desc: 'Reach the top' },
  { id: 'hilo', name: 'Hi-Lo', icon: 'TrendingUp', cat: 'Originals', desc: 'Guess higher or lower' },
  { id: 'roulette', name: 'Roulette', icon: 'Circle', cat: 'Table', desc: 'Classic roulette' },
  { id: 'blackjack', name: 'Blackjack', icon: 'Spade', cat: 'Table', desc: 'Beat the dealer' },
  { id: 'wheel', name: 'Wheel', icon: 'Disc3', cat: 'Table', desc: 'Spin the wheel' },
  { id: 'coinflip', name: 'Coin Flip', icon: 'Coins', cat: 'Instant', desc: 'Heads or tails' },
  { id: 'keno', name: 'Keno', icon: 'Grid3X3', cat: 'Instant', desc: 'Pick your numbers' },
  { id: 'slots', name: 'Slots', icon: 'Cherry', cat: 'Slots', desc: 'Classic slots' }
];

const Dashboard = () => {
  const { setCurrentGame } = useCasino();
  const categories = [...new Set(GAMES.map(g => g.cat))];

  return (
    <div className="space-y-6 pb-6">
      {categories.map((cat, catIdx) => (
        <motion.div
          key={cat}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.1 }}
        >
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GAMES.filter(g => g.cat === cat).map((game, idx) => {
              const Icon = Icons[game.icon];
              return (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: catIdx * 0.1 + idx * 0.05 }}
                  onClick={() => setCurrentGame(game.id)}
                  className="group relative h-32 rounded-xl overflow-hidden cursor-pointer"
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition duration-300" />
                  <div className="absolute inset-0 border border-slate-700/50 group-hover:border-cyan-500/50 transition" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                    {Icon && (
                      <Icon className="w-8 h-8 text-cyan-400 group-hover:text-blue-400 transition mb-2" />
                    )}
                    <div className="font-bold text-white group-hover:text-cyan-400 transition">
                      {game.name}
                    </div>
                    <div className="text-xs text-slate-400 group-hover:text-slate-300 transition mt-1">
                      {game.desc}
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Dashboard;
