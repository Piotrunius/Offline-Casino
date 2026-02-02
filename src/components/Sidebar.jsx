import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronUp, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCasino } from '../context/CasinoContext';

const GAMES = [
  { id: 'crash', name: 'Crash', icon: 'Rocket', cat: 'Originals' },
  { id: 'mines', name: 'Mines', icon: 'Bomb', cat: 'Originals' },
  { id: 'dice', name: 'Dice', icon: 'Dices', cat: 'Originals' },
  { id: 'plinko', name: 'Plinko', icon: 'Triangle', cat: 'Originals' },
  { id: 'limbo', name: 'Limbo', icon: 'ArrowUpDown', cat: 'Originals' },
  { id: 'tower', name: 'Tower', icon: 'Building2', cat: 'Originals' },
  { id: 'hilo', name: 'Hi-Lo', icon: 'TrendingUp', cat: 'Originals' },
  { id: 'roulette', name: 'Roulette', icon: 'Circle', cat: 'Table' },
  { id: 'blackjack', name: 'Blackjack', icon: 'Spade', cat: 'Table' },
  { id: 'wheel', name: 'Wheel', icon: 'Disc3', cat: 'Table' },
  { id: 'coinflip', name: 'Coin Flip', icon: 'Coins', cat: 'Instant' },
  { id: 'keno', name: 'Keno', icon: 'Grid3X3', cat: 'Instant' },
  { id: 'slots', name: 'Slots', icon: 'Cherry', cat: 'Slots' }
];

const Sidebar = () => {
  const { state, setCurrentGame } = useCasino();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState({});

  const categories = [...new Set(GAMES.map(g => g.cat))];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 lg:hidden z-30 p-3 rounded-full bg-casino-cyan hover:brightness-110 text-casino-bg transition"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed lg:static inset-y-0 left-0 w-64 border-r border-casino-border bg-casino-card backdrop-blur-md overflow-y-auto z-20 lg:z-0 top-16 lg:top-0 h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]"
      >
        <div className="p-4 space-y-1">
          <button
            onClick={() => setCurrentGame(null)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-casino-border transition text-left group"
          >
            <Home className="w-5 h-5 text-casino-cyan group-hover:text-casino-green transition" />
            <span className="font-semibold text-gray-200 group-hover:text-white transition">Dashboard</span>
          </button>

          <div className="pt-2">
            {categories.map(cat => (
              <div key={cat}>
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase text-gray-400 hover:text-gray-200 transition"
                >
                  <span>{cat}</span>
                  {expanded[cat] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: expanded[cat] ? 'auto' : 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 pb-2">
                    {GAMES.filter(g => g.cat === cat).map(game => {
                      const Icon = Icons[game.icon];
                      const isActive = state.currentGame === game.id;
                      return (
                        <button
                          key={game.id}
                          onClick={() => {
                            setCurrentGame(game.id);
                            setOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                            isActive
                              ? 'bg-casino-cyan/20 border border-casino-cyan/50 text-casino-cyan'
                              : 'text-gray-300 hover:bg-casino-border hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{game.name}</span>
                          {isActive && <div className="w-2 h-2 rounded-full bg-casino-cyan ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 lg:hidden z-10 top-16"
        />
      )}
    </>
  );
};

export default Sidebar;
