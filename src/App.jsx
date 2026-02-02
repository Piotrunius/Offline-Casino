import { useState } from 'react';
import { CasinoProvider, useCasino } from './context/CasinoContext';
import './styles/index.css';

// Games
import BlackjackGame from './games/BlackjackGame';
import CoinFlipGame from './games/CoinFlipGame';
import CrashGame from './games/CrashGame';
import DiceGame from './games/DiceGame';
import HiLoGame from './games/HiLoGame';
import KenoGame from './games/KenoGame';
import LimboGame from './games/LimboGame';
import MinesGame from './games/MinesGame';
import PlinkoGame from './games/PlinkoGame';
import RouletteGame from './games/RouletteGame';
import SlotsGame from './games/SlotsGame';
import TowerGame from './games/TowerGame';
import WheelGame from './games/WheelGame';

const GAMES = [
  { id: 'dice', name: 'Dice', icon: '🎲', component: DiceGame },
  { id: 'mines', name: 'Mines', icon: '💣', component: MinesGame },
  { id: 'crash', name: 'Crash', icon: '📈', component: CrashGame },
  { id: 'plinko', name: 'Plinko', icon: '⚪', component: PlinkoGame },
  { id: 'limbo', name: 'Limbo', icon: '🎯', component: LimboGame },
  { id: 'coinflip', name: 'Coin Flip', icon: '🪙', component: CoinFlipGame },
  { id: 'wheel', name: 'Wheel', icon: '🎡', component: WheelGame },
  { id: 'tower', name: 'Tower', icon: '🗼', component: TowerGame },
  { id: 'keno', name: 'Keno', icon: '🔢', component: KenoGame },
  { id: 'roulette', name: 'Roulette', icon: '🎰', component: RouletteGame },
  { id: 'blackjack', name: 'Blackjack', icon: '🃏', component: BlackjackGame },
  { id: 'slots', name: 'Slots', icon: '🍒', component: SlotsGame },
  { id: 'hilo', name: 'Hi-Lo', icon: '↕️', component: HiLoGame },
];

function MainApp() {
  const { state, setCurrentGame, addFreeCredits, toggleSidebar } = useCasino();
  const [activeGame, setActiveGame] = useState('dice');

  const currentGameData = GAMES.find(g => g.id === activeGame);
  const GameComponent = currentGameData?.component;

  const handleGameSelect = (gameId) => {
    setActiveGame(gameId);
    setCurrentGame(gameId);
  };

  return (
    <div className="h-screen flex bg-[#0a0a14]">
      {/* Sidebar */}
      <aside className={`${state.sidebarOpen ? 'w-64' : 'w-16'} bg-[#12121f] border-r border-[#1f1f35] flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-[#1f1f35]">
          <h1 className={`font-black text-xl gradient-text ${!state.sidebarOpen && 'text-center text-sm'}`}>
            {state.sidebarOpen ? '🎰 Casino' : '🎰'}
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                activeGame === game.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
              }`}
            >
              <span className="text-xl">{game.icon}</span>
              {state.sidebarOpen && <span className="font-semibold text-sm">{game.name}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={() => toggleSidebar()}
          className="p-4 border-t border-[#1f1f35] text-gray-500 hover:text-white transition"
        >
          {state.sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#12121f] border-b border-[#1f1f35] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{currentGameData?.icon}</span>
            <h2 className="text-xl font-bold text-white">{currentGameData?.name}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#1a1a2e] rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-gray-400 text-sm">Balance:</span>
              <span className="text-cyan-400 font-bold text-lg">${state.balance.toFixed(2)}</span>
            </div>

            <button
              onClick={() => addFreeCredits(1000)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:brightness-110 transition"
            >
              + $1000
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {GameComponent && <GameComponent />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CasinoProvider>
      <MainApp />
    </CasinoProvider>
  );
}
