import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useCasino } from './context/CasinoContext';
import audioEngine from './utils/audioEngine';

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

import ProvablyFairModal from './components/modals/ProvablyFairModal';
import SettingsModal from './components/modals/SettingsModal';
import StatsModal from './components/modals/StatsModal';

const games = {
  crash: CrashGame,
  mines: MinesGame,
  dice: DiceGame,
  plinko: PlinkoGame,
  limbo: LimboGame,
  roulette: RouletteGame,
  blackjack: BlackjackGame,
  coinflip: CoinFlipGame,
  tower: TowerGame,
  keno: KenoGame,
  slots: SlotsGame,
  wheel: WheelGame,
  hilo: HiLoGame
};

function App() {
  const { state, setCurrentGame, setModal } = useCasino();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    audioEngine.init();
    setLoaded(true);
    return () => audioEngine.destroy();
  }, []);

  const CurrentGame = state.currentGame ? games[state.currentGame] : null;

  const renderModal = () => {
    switch (state.modalOpen) {
      case 'settings':
        return <SettingsModal onClose={() => setModal(null)} />;
      case 'provablyFair':
        return <ProvablyFairModal onClose={() => setModal(null)} />;
      case 'stats':
        return <StatsModal onClose={() => setModal(null)} />;
      default:
        return null;
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-casino-bg flex items-center justify-center">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-casino-cyan/20 border-t-casino-cyan rounded-full animate-spin mx-auto mb-4" />
            <p className="text-casino-cyan font-semibold tracking-widest">CASINO</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casino-bg text-white">
      <Header />

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          {CurrentGame ? (
            <motion.div
              key={state.currentGame}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 md:p-6 max-w-7xl mx-auto h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setCurrentGame(null)}
                  className="px-4 py-2 rounded-lg bg-casino-card hover:bg-casino-border transition text-sm font-medium border border-casino-border"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-casino-cyan">
                  {Object.keys(games).find(key => games[key] === CurrentGame)?.toUpperCase() || 'Game'}
                </h1>
              </div>

              <div className="h-[calc(100%-60px)]">
                <CurrentGame />
              </div>
            </motion.div>
          ) : (
            <div className="p-4 md:p-6">
              <Dashboard onSelectGame={setCurrentGame} />
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {state.modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10"
            >
              {renderModal()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
