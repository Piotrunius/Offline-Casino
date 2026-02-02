import { LogOut, Settings, TrendingUp, Zap } from 'lucide-react';
import { useCasino } from '../context/CasinoContext';

const Header = () => {
  const { state, setModal } = useCasino();
  const { balance, stats } = state;

  return (
    <header className="h-16 border-b border-casino-border bg-casino-card backdrop-blur-md sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-casino-cyan">
            ⚡ CASINO
          </h1>
          <div className="hidden sm:flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap className="w-4 h-4 text-casino-cyan" />
              <span>Balance: <span className="text-white font-bold">${balance.toFixed(2)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp className="w-4 h-4 text-casino-green" />
              <span>Win Rate: <span className="text-casino-green font-bold">{stats.winRate.toFixed(1)}%</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal('stats')}
            className="p-2 rounded-lg hover:bg-casino-border transition text-gray-400 hover:text-casino-cyan"
            title="Statistics"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setModal('settings')}
            className="p-2 rounded-lg hover:bg-casino-border transition text-gray-400 hover:text-casino-cyan"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setModal('provablyFair')}
            className="p-2 rounded-lg hover:bg-casino-border transition text-gray-400 hover:text-casino-cyan"
            title="Provably Fair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile balance bar */}
      <div className="sm:hidden px-4 py-2 bg-casino-bg text-xs flex gap-4 border-t border-casino-border">
        <div className="flex-1">Balance: <span className="text-casino-cyan font-bold">${balance.toFixed(2)}</span></div>
        <div className="flex-1 text-right">Win Rate: <span className="text-casino-green font-bold">{stats.winRate.toFixed(1)}%</span></div>
      </div>
    </header>
  );
};

export default Header;
