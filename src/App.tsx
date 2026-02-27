import { motion } from 'framer-motion';
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
  Gift,
  Hash,
  Home,
  Info,
  LayoutGrid,
  Menu,
  Plus,
  RectangleVertical,
  Rocket,
  Save,
  Settings,
  Spade,
  Target,
  Trophy,
  Volume2, VolumeX,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCasino } from './context/CasinoContext';
import audio from './utils/audioEngine';
import trackingEngine from './utils/trackingEngine';

// Game imports
import AchievementsModal from './components/AchievementsModal';
import AdminPanel from './components/AdminPanel';
import DailyBonusModal from './components/DailyBonusModal';
import Dashboard from './components/Dashboard';
import FeedbackButton from './components/FeedbackButton';
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
import ScratchCardsGame from './games/ScratchCardsGame';
import SicboGame from './games/SicboGame';
import SlotsGame from './games/SlotsGame';
import ThreeCardPokerGame from './games/ThreeCardPokerGame';
import TicTacToeGame from './games/TicTacToeGame';
import TowerGame from './games/TowerGame';
import VideoPokerGame from './games/VideoPokerGame';
import WarGame from './games/WarGame';

const GAMES = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, component: Dashboard, color: '#00f5ff' },
  { id: 'dice', name: 'Dice', icon: Dices, component: DiceGame, color: '#00f5ff' },
  { id: 'mines', name: 'Mines', icon: Bomb, component: MinesGame, color: '#ff3366' },
  { id: 'crash', name: 'Crash', icon: Rocket, component: CrashGame, color: '#ff8800' },
  { id: 'scratchcards', name: 'Scratch Cards', icon: Eraser, component: ScratchCardsGame, color: '#ff9900' },
  { id: 'limbo', name: 'Limbo', icon: Target, component: LimboGame, color: '#aa00ff' },
  { id: 'coinflip', name: 'Coin Flip', icon: Coins, component: CoinFlipGame, color: '#ffee00' },
  { id: 'tower', name: 'Tower', icon: Building2, component: TowerGame, color: '#00ccff' },
  { id: 'keno', name: 'Keno', icon: LayoutGrid, component: KenoGame, color: '#ff6600' },
  { id: 'blackjack', name: 'Blackjack', icon: Spade, component: BlackjackGame, color: '#ff4444' },
  { id: 'slots', name: 'Slots', icon: Cherry, component: SlotsGame, color: '#ffaa00' },
  { id: 'war', name: 'War', icon: RectangleVertical, component: WarGame, color: '#ff6600' },
  { id: 'hilo', name: 'HiLo', icon: ArrowUpDown, component: HiLoGame, color: '#ff00aa' },
  { id: 'baccarat', name: 'Baccarat', icon: Gem, component: BaccaratGame, color: '#8844ff' },
  { id: 'dragontiger', name: 'Dragon Tiger', icon: Flame, component: DragonTigerGame, color: '#ff6633' },
  { id: 'videopoker', name: 'Video Poker', icon: Gamepad2, component: VideoPokerGame, color: '#00ccaa' },
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: Hash, component: TicTacToeGame, color: '#4488ff' },
  { id: 'sicbo', name: 'Sicbo', icon: Dice5, component: SicboGame, color: '#ff9933' },
  { id: 'threecardpoker', name: '3 Card Poker', icon: Files, component: ThreeCardPokerGame, color: '#cc33ff' }
];

// (Stock Exchange removed)

export default function App() {
  const {
    state, addFreeCredits, updateSettings, exportProgress, importProgress,
    showLargeBetConfirm, confirmLargeBet, cancelLargeBet,
    winEffect, clearWinEffect, showBetUpdateSuggestion, suggestNewBet, updateLastKnownBalance,
    setBalance, updateAdminSettings, resetStats
  } = useCasino() as any;
  const [activeGame, setActiveGame] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);

  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Secret admin access
  const secretSequence = ['Digit7', 'Digit7', 'Digit7', 'KeyP', 'KeyI', 'KeyO', 'KeyT', 'KeyR', 'Enter'];
  const secretIndex = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === secretSequence[secretIndex.current]) {
        secretIndex.current++;
        if (secretIndex.current === secretSequence.length) {
          const newState = !showAdminPanel;
          setShowAdminPanel(newState);
          secretIndex.current = 0;
          audio.playWin();
          trackingEngine.trackAdminAction('admin_panel_toggle', { opened: newState });
        }
      } else {
        secretIndex.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdminPanel]);

  const ActiveGameComponent = GAMES.find(g => g.id === activeGame)?.component || DiceGame;
  const activeGameData = GAMES.find(g => g.id === activeGame);

  useEffect(() => {
    audio.setEnabled(state.settings.soundEnabled);
    audio.setVolume(state.settings.soundVolume);
  }, [state.settings.soundEnabled, state.settings.soundVolume]);

  const handleGameChange = (gameId: string) => {
    audio.playClick();
    trackingEngine.trackGameChange(activeGame, gameId);
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
          <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
            <div className="space-y-1">
              {GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleGameChange(game.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    activeGame === game.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-l-2'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: activeGame === game.id ? game.color : 'transparent',
                    color: activeGame === game.id ? game.color : '#888'
                  }}
                >
                  <div className="w-5 h-5">
                    <game.icon size={20} />
                  </div>
                  {sidebarOpen && (
                    <span className={`font-medium text-sm ${activeGame === game.id ? 'text-white' : ''}`}>
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
                <div className="w-5 h-5 flex items-center justify-center">
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center" style={{ color: activeGameData?.color }}>
                  {activeGameData && <activeGameData.icon size={24} />}
                </div>
                <h2 className="font-bold text-xl text-white">{activeGameData?.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet - Balance */}
              <div className="flex items-center gap-3 bg-[#0a0a10] border border-white/10 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm hidden sm:inline">Cash:</span>
                    <span className="font-bold text-white number-mono">${state.balance.toFixed(2)}</span>
                  </div>
                  {/* stock exchange removed */}
                </div>

              {/* Add Credits */}
              {state.balance <= 10 && (state.freeCreditsUsed || 0) < 3 && (
                <button
                  onClick={() => {
                    if (addFreeCredits(1000)) {
                      trackingEngine.trackAddFreeCredits(1000, (state.freeCreditsUsed || 0) + 1);
                      audio.playCashout();
                    }
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-3 py-2 rounded-xl font-semibold transition-all animate-pulse"
                >
                  <div className="w-4 h-4 flex items-center justify-center"><Plus size={16} /></div>
                  <span className="hidden sm:inline">$1000</span>
                </button>
              )}

              {/* Game Info Button */}
              {activeGame !== 'dashboard' && (
                <button
                  onClick={() => setShowGameInfo(activeGame as any)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  title="Game Info"
                >
                  <div className="w-5 h-5 flex items-center justify-center relative"><Info size={20} /></div>
                </button>
              )}

              {/* Daily Bonus Button */}
               <button
                onClick={() => {
                  trackingEngine.trackOpenModal('daily_bonus');
                  setShowDailyBonus(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 transition-all relative"
                title="Daily Bonus"
              >
                <div className="w-5 h-5 flex items-center justify-center relative"><Gift size={20} /></div>
                {Date.now() - (state.dailyBonus?.lastClaimed || 0) > 86400000 && (
                   <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>

              {/* Achievements Button */}
              <button
                onClick={() => {
                  trackingEngine.trackOpenModal('achievements');
                  setShowAchievements(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all relative"
                title="Achievements"
              >
                <div className="w-5 h-5 flex items-center justify-center relative"><Trophy size={20} /></div>
              </button>

              {/* Stock Exchange removed */}

              {/* Save/Load Button */}
              <button
                onClick={() => {
                  trackingEngine.trackOpenModal('export_import');
                  setExportCode(exportProgress());
                  setShowExportImport(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all relative"
                title="Save/Load"
              >
                <div className="w-5 h-5 flex items-center justify-center relative"><Save size={20} /></div>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => {
                  trackingEngine.trackOpenModal('settings');
                  setShowSettings(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all relative"
                title="Settings"
              >
                <div className="w-5 h-5 flex items-center justify-center relative"><Settings size={20} /></div>
              </button>

              {/* Feedback Button */}
              <FeedbackButton currentPage={activeGame} getExportCode={exportProgress} />

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  const newSoundState = !state.settings.soundEnabled;
                  trackingEngine.trackToggleSetting('sound_enabled', newSoundState);
                  updateSettings({ soundEnabled: newSoundState });
                  if (newSoundState) audio.playClick();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  state.settings.soundEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {state.settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Game Area */}
        <div className={`flex-1 p-4 lg:p-6 ${activeGame === 'dashboard' ? 'overflow-auto' : 'overflow-hidden'}`}>
          {activeGame === 'dashboard' ? (
            <ActiveGameComponent onSelectGame={handleGameChange} />
          ) : (
            <ActiveGameComponent onSelectGame={handleGameChange} />
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

      {/* MODALS */}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
      {showDailyBonus && <DailyBonusModal onClose={() => setShowDailyBonus(false)} />}

      {/* LARGE BET CONFIRMATION MODAL */}
      {showLargeBetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={cancelLargeBet} />
          <div className="relative bg-[#0a0a10] border border-yellow-500/50 rounded-2xl p-6 w-full max-w-sm animate-bounce-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Info size={32} />
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
                <Trophy size={32} />
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 text-gray-400 hover:text-white flex items-center justify-center">
                <X size={20} />
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
                      onClick={() => {
                        const newValue = !state.settings.soundEnabled;
                        trackingEngine.trackToggleSetting('sound_effects', newValue);
                        updateSettings({ soundEnabled: newValue });
                      }}
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
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        trackingEngine.trackSettingChange('sound_volume', state.settings.soundVolume, newVolume);
                        updateSettings({ soundVolume: newVolume });
                      }}
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
                      onClick={() => {
                        const newValue = !state.settings.winEffectsEnabled;
                        trackingEngine.trackToggleSetting('win_effects', newValue);
                        updateSettings({ winEffectsEnabled: newValue });
                      }}
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
                      onClick={() => {
                        const newValue = !state.settings.fastMode;
                        trackingEngine.trackToggleSetting('fast_mode', newValue);
                        updateSettings({ fastMode: newValue });
                      }}
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
                      onClick={() => {
                        const newValue = !state.settings.confirmLargeBets;
                        trackingEngine.trackToggleSetting('confirm_large_bets', newValue);
                        updateSettings({ confirmLargeBets: newValue });
                      }}
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
          </motion.div>
        </div>
      )}

      {/* Export/Import Modal */}
      {showExportImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowExportImport(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Save / Load Progress</h3>
              <button onClick={() => setShowExportImport(false)} className="w-8 h-8 text-gray-400 hover:text-white flex items-center justify-center">
                <X size={20} />
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
                  onClick={(e) => e.currentTarget.select()}
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
                    trackingEngine.trackImportProgress(success);
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
          </motion.div>
        </div>
      )}

      {/* Game Info Modal */}
      {showGameInfo && (
        <GameInfoModal
          gameId={showGameInfo}
          onClose={() => setShowGameInfo(null)}
        />
      )}

      {/* Admin Panel */}
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
