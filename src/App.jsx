import { useEffect, useRef, useState } from 'react';
import { useCasino } from './context/CasinoContext';
import audio from './utils/audioEngine';

// Icons as SVG components
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Dice: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
      <circle cx="16" cy="8" r="1" fill="currentColor"/>
      <circle cx="8" cy="16" r="1" fill="currentColor"/>
      <circle cx="16" cy="16" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
  DiceThree: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="12" height="12" rx="2"/>
      <rect x="10" y="2" width="12" height="12" rx="2"/>
      <circle cx="16" cy="8" r="1" fill="currentColor"/>
      <circle cx="8" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
  Mine: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="6"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  Rocket: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Coin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
    </svg>
  ),
  Tower: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="12" height="4"/>
      <rect x="7" y="8" width="10" height="4"/>
      <rect x="8" y="12" width="8" height="4"/>
      <rect x="9" y="16" width="6" height="4"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  Blackjack: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="10" height="14" rx="2"/>
      <text x="8" y="13" fontSize="7" fill="currentColor" textAnchor="middle">21</text>
      <rect x="11" y="6" width="10" height="14" rx="2"/>
    </svg>
  ),
  Baccarat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="8" height="12" rx="1"/>
      <rect x="14" y="5" width="8" height="12" rx="1"/>
      <text x="6" y="13" fontSize="5" fill="currentColor" textAnchor="middle">P</text>
      <text x="18" y="13" fontSize="5" fill="currentColor" textAnchor="middle">B</text>
    </svg>
  ),
  DragonTiger: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8c2-4 6-4 8-2s6 0 8-2"/>
      <path d="M4 16c2 4 6 4 8 2s6 0 8 2"/>
      <circle cx="8" cy="12" r="2"/>
      <circle cx="16" cy="12" r="2"/>
    </svg>
  ),
  VideoPoker: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="6" height="10" rx="1"/>
      <rect x="9" y="6" width="6" height="10" rx="1"/>
      <rect x="16" y="6" width="6" height="10" rx="1"/>
      <path d="M5 18v2M12 18v2M19 18v2"/>
    </svg>
  ),
  ThreeCards: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="7" height="12" rx="1" transform="rotate(-5 5 12)"/>
      <rect x="8" y="5" width="7" height="12" rx="1"/>
      <rect x="14" y="6" width="7" height="12" rx="1" transform="rotate(5 18 12)"/>
    </svg>
  ),
  Slots: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <line x1="8" y1="4" x2="8" y2="20"/>
      <line x1="16" y1="4" x2="16" y2="20"/>
    </svg>
  ),
  HiLo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5l-7 7h14z"/>
      <path d="M12 19l-7-7h14z"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Volume: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  VolumeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Stats: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Sparkles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z"/>
    </svg>
  )
};

// Game imports
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import GameInfoModal from './components/GameInfoModal';
import WinEffects from './components/WinEffects';
import BaccaratGame from './games/BaccaratGame';
import BlackjackGame from './games/BlackjackGame';
import CoinFlipGame from './games/CoinFlipGame';
import CrashGame from './games/CrashGame';
import DiceGame from './games/DiceGame';
import DragonTigerGame from './games/DragonTigerGame';
import HiLoGame from './games/HiLoGame';
import KenoGame from './games/KenoGame';
import LimboGame from './games/LimboGame';
import MinesGame from './games/MinesGame';
import SicboGame from './games/SicboGame';
import SlotsGame from './games/SlotsGame';
import ThreeCardPokerGame from './games/ThreeCardPokerGame';
import TowerGame from './games/TowerGame';
import VideoPokerGame from './games/VideoPokerGame';

const GAMES = [
  { id: 'dashboard', name: 'Dashboard', icon: Icons.Home, component: Dashboard, color: '#00f5ff' },
  { id: 'dice', name: 'Dice', icon: Icons.Dice, component: DiceGame, color: '#00f5ff' },
  { id: 'mines', name: 'Mines', icon: Icons.Mine, component: MinesGame, color: '#ff3366' },
  { id: 'crash', name: 'Crash', icon: Icons.Rocket, component: CrashGame, color: '#ff8800' },
  { id: 'limbo', name: 'Limbo', icon: Icons.Target, component: LimboGame, color: '#aa00ff' },
  { id: 'coinflip', name: 'Coin Flip', icon: Icons.Coin, component: CoinFlipGame, color: '#ffee00' },
  { id: 'tower', name: 'Tower', icon: Icons.Tower, component: TowerGame, color: '#00ccff' },
  { id: 'keno', name: 'Keno', icon: Icons.Grid, component: KenoGame, color: '#ff6600' },
  { id: 'blackjack', name: 'Blackjack', icon: Icons.Blackjack, component: BlackjackGame, color: '#ff4444' },
  { id: 'slots', name: 'Slots', icon: Icons.Slots, component: SlotsGame, color: '#ffaa00' },
  { id: 'hilo', name: 'HiLo', icon: Icons.HiLo, component: HiLoGame, color: '#ff00aa' },
  { id: 'baccarat', name: 'Baccarat', icon: Icons.Baccarat, component: BaccaratGame, color: '#8844ff' },
  { id: 'dragontiger', name: 'Dragon Tiger', icon: Icons.DragonTiger, component: DragonTigerGame, color: '#ff6633' },
  { id: 'videopoker', name: 'Video Poker', icon: Icons.VideoPoker, component: VideoPokerGame, color: '#00ccaa' },
  { id: 'sicbo', name: 'Sicbo', icon: Icons.DiceThree, component: SicboGame, color: '#ff9933' },
  { id: 'threecardpoker', name: '3 Card Poker', icon: Icons.ThreeCards, component: ThreeCardPokerGame, color: '#cc33ff' }
];

export default function App() {
  const {
    state, addFreeCredits, updateSettings, exportProgress, importProgress,
    showLargeBetConfirm, confirmLargeBet, cancelLargeBet,
    winEffect, clearWinEffect, showBetUpdateSuggestion, suggestNewBet, updateLastKnownBalance,
    setBalance, updateAdminSettings, resetStats
  } = useCasino();
  const [activeGame, setActiveGame] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Konami Code detection
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  const konamiIndex = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === konamiCode[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === konamiCode.length) {
          setShowAdminPanel(prev => !prev);
          konamiIndex.current = 0;
          audio.playWin();
        }
      } else {
        konamiIndex.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ActiveGameComponent = GAMES.find(g => g.id === activeGame)?.component || DiceGame;
  const activeGameData = GAMES.find(g => g.id === activeGame);

  useEffect(() => {
    audio.setEnabled(state.settings.soundEnabled);
    audio.setVolume(state.settings.soundVolume);
  }, [state.settings.soundEnabled, state.settings.soundVolume]);

  const handleGameChange = (gameId) => {
    audio.playClick();
    setActiveGame(gameId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#050508] border-r border-white/5 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">C</span>
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-white">Casino</h1>
                  <p className="text-xs text-gray-500">Offline Edition</p>
                </div>
              )}
            </div>
          </div>

          {/* Games List */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleGameChange(game.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    activeGame === game.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-l-2'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: activeGame === game.id ? game.color : 'transparent',
                    color: activeGame === game.id ? game.color : '#888'
                  }}
                >
                  <div className="w-6 h-6">
                    <game.icon />
                  </div>
                  {sidebarOpen && (
                    <span className={`font-medium ${activeGame === game.id ? 'text-white' : ''}`}>
                      {game.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-5 h-5">
                  {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8" style={{ color: activeGameData?.color }}>
                  {activeGameData && <activeGameData.icon />}
                </div>
                <h2 className="font-bold text-xl text-white">{activeGameData?.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Balance */}
              <div className="flex items-center gap-2 bg-[#0a0a10] border border-white/10 rounded-xl px-4 py-2">
                <span className="text-gray-400 text-sm hidden sm:inline">Balance:</span>
                <span className="font-bold text-white number-mono">${state.balance.toFixed(2)}</span>
              </div>

              {/* Add Credits */}
              {state.balance <= 10 && (state.freeCreditsUsed || 0) < 3 && (
                <button
                  onClick={() => {
                    if (addFreeCredits(1000)) {
                      audio.playCashout();
                    }
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-3 py-2 rounded-xl font-semibold transition-all animate-pulse"
                >
                  <div className="w-4 h-4"><Icons.Plus /></div>
                  <span className="hidden sm:inline">+$1000</span>
                </button>
              )}

              {/* Game Info Button */}
              {activeGame !== 'dashboard' && (
                <button
                  onClick={() => setShowGameInfo(activeGame)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  title="Game Info"
                >
                  <div className="w-5 h-5"><Icons.Info /></div>
                </button>
              )}

              {/* Statistics Button */}
              <button
                onClick={() => setShowStats(true)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="Statistics"
              >
                <div className="w-5 h-5"><Icons.Stats /></div>
              </button>

              {/* Save/Load Button */}
              <button
                onClick={() => {
                  setExportCode(exportProgress());
                  setShowExportImport(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                title="Save/Load"
              >
                <div className="w-5 h-5"><Icons.Save /></div>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                title="Settings"
              >
                <div className="w-5 h-5"><Icons.Settings /></div>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  updateSettings({ soundEnabled: !state.settings.soundEnabled });
                  if (!state.settings.soundEnabled) audio.playClick();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  state.settings.soundEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'
                }`}
              >
                <div className="w-5 h-5">
                  {state.settings.soundEnabled ? <Icons.Volume /> : <Icons.VolumeOff />}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Game Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeGame === 'dashboard' ? (
            <ActiveGameComponent onSelectGame={handleGameChange} />
          ) : (
            <ActiveGameComponent />
          )}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* WIN EFFECTS */}
      <WinEffects
        win={winEffect}
        onComplete={clearWinEffect}
        enabled={state.settings.winEffectsEnabled}
      />

      {/* LARGE BET CONFIRMATION MODAL */}
      {showLargeBetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={cancelLargeBet} />
          <div className="relative bg-[#0a0a10] border border-yellow-500/50 rounded-2xl p-6 w-full max-w-sm animate-bounce-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Large Bet Warning</h3>
              <p className="text-gray-400 mb-4">
                You're about to bet <span className="text-yellow-400 font-bold">${showLargeBetConfirm.amount.toFixed(2)}</span>
                <br/>
                <span className="text-sm">({((showLargeBetConfirm.amount / state.balance) * 100).toFixed(0)}% of your balance)</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLargeBet}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLargeBet}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold transition-all"
                >
                  Confirm Bet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BET UPDATE SUGGESTION MODAL */}
      {showBetUpdateSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={updateLastKnownBalance} />
          <div className="relative bg-[#0a0a10] border border-green-500/50 rounded-2xl p-6 w-full max-w-sm animate-bounce-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Icons.Trophy />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Balance Increased!</h3>
              <p className="text-gray-400 mb-4">
                Your balance has increased significantly. Would you like to update your bet amount to 5% of your new balance?
                <br/>
                <span className="text-green-400 font-bold">${Math.floor(state.balance * 0.05)}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={updateLastKnownBalance}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all"
                >
                  Keep Current
                </button>
                <button
                  onClick={suggestNewBet}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold transition-all"
                >
                  Update Bet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowSettings(false)} />
          <div className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 text-gray-400 hover:text-white">
                <Icons.Close />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sound Section */}
              <div>
                <div className="text-xs uppercase text-gray-500 mb-3">Audio</div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sound Effects</span>
                    <button
                      onClick={() => updateSettings({ soundEnabled: !state.settings.soundEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${state.settings.soundEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${state.settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Volume</span>
                      <span className="text-gray-500 text-sm">{Math.round(state.settings.soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.settings.soundVolume}
                      onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gameplay Section */}
              <div>
                <div className="text-xs uppercase text-gray-500 mb-3">Gameplay</div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300">Win Effects</span>
                      <p className="text-xs text-gray-500">Celebratory effects on big wins</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ winEffectsEnabled: !state.settings.winEffectsEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${state.settings.winEffectsEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${state.settings.winEffectsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300">Fast Mode</span>
                      <p className="text-xs text-gray-500">Speed up game animations</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ fastMode: !state.settings.fastMode })}
                      className={`w-12 h-6 rounded-full transition-colors ${state.settings.fastMode ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${state.settings.fastMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300">Confirm Large Bets</span>
                      <p className="text-xs text-gray-500">Warn before betting over 50% balance</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ confirmLargeBets: !state.settings.confirmLargeBets })}
                      className={`w-12 h-6 rounded-full transition-colors ${state.settings.confirmLargeBets ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${state.settings.confirmLargeBets ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Betting Info */}
              <div>
                <div className="text-xs uppercase text-gray-500 mb-3">Betting</div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Current Global Bet</span>
                    <span className="text-cyan-400 font-bold">${state.globalBet}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Bet amount syncs across all games. Use 5% button in any game for auto-calculation.
                  </p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-gray-800">
                <div className="text-xs uppercase text-red-500 mb-3">Danger Zone</div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                      localStorage.removeItem('casino_state');
                      window.location.reload();
                    }
                  }}
                  className="w-full py-2 bg-red-900/30 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/50 transition"
                >
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowStats(false)} />
          <div className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-lg animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Statistics</h3>
              <button onClick={() => setShowStats(false)} className="w-8 h-8 text-gray-400 hover:text-white">
                <Icons.Close />
              </button>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Games Played</div>
                <div className="text-2xl font-bold text-white">{state.gamesPlayed}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Total Wagered</div>
                <div className="text-2xl font-bold text-white">${state.totalBets.toFixed(0)}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Net Profit</div>
                <div className={`text-2xl font-bold ${state.totalWins - state.totalLosses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(state.totalWins - state.totalLosses).toFixed(0)}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Win Rate</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {state.gamesPlayed > 0 ? ((state.history?.filter(h => h.profit > 0).length || 0) / state.gamesPlayed * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Biggest Win</div>
                <div className="text-2xl font-bold text-yellow-400">${state.biggestWin.toFixed(0)}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="text-gray-500 text-xs uppercase">Best Streak</div>
                <div className="text-2xl font-bold text-purple-400">{state.bestStreak}</div>
              </div>
            </div>

            {/* Per-Game Stats */}
            {state.history && state.history.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 mb-3">Performance by Game</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(() => {
                    const gameData = {};
                    state.history.forEach(h => {
                      if (!gameData[h.game]) gameData[h.game] = { profit: 0, count: 0, wins: 0 };
                      gameData[h.game].profit += h.profit;
                      gameData[h.game].count++;
                      if (h.profit > 0) gameData[h.game].wins++;
                    });
                    return Object.entries(gameData)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([game, data]) => (
                        <div key={game} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="capitalize text-white font-medium">{game}</span>
                            <span className="text-xs text-gray-500">{data.count} games</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400">
                              {((data.wins / data.count) * 100).toFixed(0)}% WR
                            </span>
                            <span className={`font-bold ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export/Import Modal */}
      {showExportImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowExportImport(false)} />
          <div className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-lg animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Save / Load Progress</h3>
              <button onClick={() => setShowExportImport(false)} className="w-8 h-8 text-gray-400 hover:text-white">
                <Icons.Close />
              </button>
            </div>

            {/* Export Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Export Code (copy this to save)</label>
              <div className="relative">
                <textarea
                  readOnly
                  value={exportCode}
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportCode);
                    audio.playClick();
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/30"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Import Code (paste to load)</label>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste your save code here..."
                className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none placeholder-gray-600"
              />
              {importStatus && (
                <div className={`mt-2 text-sm ${importStatus.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                  {importStatus}
                </div>
              )}
              <button
                onClick={() => {
                  if (importCode.trim()) {
                    const success = importProgress(importCode.trim());
                    if (success) {
                      setImportStatus('Success! Progress loaded.');
                      audio.playWin();
                      setTimeout(() => {
                        setShowExportImport(false);
                        setImportStatus('');
                        setImportCode('');
                      }, 1500);
                    } else {
                      setImportStatus('Invalid code. Please check and try again.');
                      audio.playLose();
                    }
                  }
                }}
                className="mt-3 w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-lg transition-all"
              >
                Load Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Info Modal */}
      {showGameInfo && (
        <GameInfoModal
          gameId={showGameInfo}
          onClose={() => setShowGameInfo(null)}
        />
      )}

      {/* Admin Panel (Konami Code) */}
      {showAdminPanel && (
        <AdminPanel
          state={state}
          onClose={() => setShowAdminPanel(false)}
          onUpdateBalance={setBalance}
          onUpdateSettings={updateAdminSettings}
          onResetStats={resetStats}
        />
      )}
    </div>
  );
}
