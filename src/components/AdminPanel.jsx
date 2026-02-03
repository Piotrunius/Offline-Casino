import { useState } from 'react';

export default function AdminPanel({ state, onClose, onUpdateBalance, onUpdateSettings, onResetStats }) {
  const [balance, setBalance] = useState(state.balance);
  const [addAmount, setAddAmount] = useState(10000);

  // Game settings
  const [globalWinBoost, setGlobalWinBoost] = useState(state.adminSettings?.globalWinBoost || 0);
  const [guaranteedWins, setGuaranteedWins] = useState(state.adminSettings?.guaranteedWins || 0);
  const [jackpotChance, setJackpotChance] = useState(state.adminSettings?.jackpotChance || 0);
  const [jackpotMultiplier, setJackpotMultiplier] = useState(state.adminSettings?.jackpotMultiplier || 100);
  const [godMode, setGodMode] = useState(state.adminSettings?.godMode || false);
  const [infiniteMoney, setInfiniteMoney] = useState(state.adminSettings?.infiniteMoney || false);

  // Per-game settings
  const [gameSettings, setGameSettings] = useState(state.adminSettings?.gameSettings || {
    dice: { winBoost: 0, forceWin: false },
    crash: { minCrash: 1, maxCrash: 100, forceWin: false },
    mines: { revealSafe: false, noMines: false },
    slots: { winBoost: 0, forceJackpot: false },
    blackjack: { dealerBust: false, alwaysBlackjack: false },
    coinflip: { alwaysWin: false },
    tower: { noTraps: false },
    limbo: { forceHit: false },
    keno: { extraMatches: 0 },
    hilo: { showNextCard: false },
    baccarat: { forceBankerWin: false, forcePlayerWin: false },
    sicbo: { forceTriple: false },
    plinko: { forceHighMultiplier: false },
    horses: { alwaysWin: false },
    tictactoe: { aiMakesStupidMoves: false },
  });

  const handleSave = () => {
    onUpdateSettings({
      globalWinBoost,
      guaranteedWins,
      jackpotChance,
      jackpotMultiplier,
      godMode,
      infiniteMoney,
      gameSettings
    });
  };

  const handleAddMoney = () => {
    onUpdateBalance(state.balance + addAmount);
  };

  const handleSetBalance = () => {
    onUpdateBalance(balance);
  };

  const updateGameSetting = (game, key, value) => {
    setGameSettings(prev => ({
      ...prev,
      [game]: { ...prev[game], [key]: value }
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-red-950 to-gray-900 border-2 border-red-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-bounce-in">
        {/* Header */}
        <div className="bg-red-900/50 border-b border-red-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-red-400">ADMIN PANEL</h2>
              <p className="text-xs text-red-300/60">Konami Code Activated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Balance Controls */}
          <div className="bg-black/40 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              💰 Balance Controls
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Add Money</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                    className="flex-1 bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={handleAddMoney}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white"
                  >
                    + ADD
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1000, 10000, 100000, 1000000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAddAmount(amt)}
                      className="flex-1 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 rounded text-red-300"
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Set Balance Directly</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="flex-1 bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={handleSetBalance}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white"
                  >
                    SET
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Current: ${state.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Global Modifiers */}
          <div className="bg-black/40 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              ⚡ Global Modifiers
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Win Boost (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={globalWinBoost}
                  onChange={(e) => setGlobalWinBoost(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="text-center text-red-400 font-bold">+{globalWinBoost}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Guaranteed Wins (next N games)</label>
                <input
                  type="number"
                  min={0}
                  value={guaranteedWins}
                  onChange={(e) => setGuaranteedWins(Number(e.target.value))}
                  className="w-full bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Jackpot Chance (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={jackpotChance}
                  onChange={(e) => setJackpotChance(Number(e.target.value))}
                  className="w-full accent-yellow-500"
                />
                <div className="text-center text-yellow-400 font-bold">{jackpotChance}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Jackpot Multiplier</label>
                <input
                  type="number"
                  min={1}
                  value={jackpotMultiplier}
                  onChange={(e) => setJackpotMultiplier(Number(e.target.value))}
                  className="w-full bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGodMode(!godMode)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    godMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  👼 GOD MODE {godMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInfiniteMoney(!infiniteMoney)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    infiniteMoney ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  ∞ INFINITE $ {infiniteMoney ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Per-Game Settings */}
          <div className="bg-black/40 rounded-xl p-4 border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              🎮 Per-Game Cheats
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Dice */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎲 Dice</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.dice?.forceWin}
                    onChange={(e) => updateGameSetting('dice', 'forceWin', e.target.checked)}
                    className="accent-red-500"
                  />
                  Always Win
                </label>
              </div>

              {/* Crash */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🚀 Crash</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.crash?.forceWin}
                    onChange={(e) => updateGameSetting('crash', 'forceWin', e.target.checked)}
                    className="accent-red-500"
                  />
                  Never Crash Early
                </label>
              </div>

              {/* Mines */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">💣 Mines</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.mines?.revealSafe}
                    onChange={(e) => updateGameSetting('mines', 'revealSafe', e.target.checked)}
                    className="accent-red-500"
                  />
                  Highlight Safe Tiles
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                  <input
                    type="checkbox"
                    checked={gameSettings.mines?.noMines}
                    onChange={(e) => updateGameSetting('mines', 'noMines', e.target.checked)}
                    className="accent-red-500"
                  />
                  No Mines (All Safe)
                </label>
              </div>

              {/* Slots */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎰 Slots</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.slots?.forceJackpot}
                    onChange={(e) => updateGameSetting('slots', 'forceJackpot', e.target.checked)}
                    className="accent-red-500"
                  />
                  Force Jackpot
                </label>
              </div>

              {/* Blackjack */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🃏 Blackjack</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.blackjack?.dealerBust}
                    onChange={(e) => updateGameSetting('blackjack', 'dealerBust', e.target.checked)}
                    className="accent-red-500"
                  />
                  Dealer Always Busts
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                  <input
                    type="checkbox"
                    checked={gameSettings.blackjack?.alwaysBlackjack}
                    onChange={(e) => updateGameSetting('blackjack', 'alwaysBlackjack', e.target.checked)}
                    className="accent-red-500"
                  />
                  Always Blackjack
                </label>
              </div>

              {/* Coin Flip */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🪙 Coin Flip</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.coinflip?.alwaysWin}
                    onChange={(e) => updateGameSetting('coinflip', 'alwaysWin', e.target.checked)}
                    className="accent-red-500"
                  />
                  Always Win
                </label>
              </div>

              {/* Tower */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🗼 Tower</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.tower?.noTraps}
                    onChange={(e) => updateGameSetting('tower', 'noTraps', e.target.checked)}
                    className="accent-red-500"
                  />
                  No Traps (All Safe)
                </label>
              </div>

              {/* Limbo */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎯 Limbo</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.limbo?.forceHit}
                    onChange={(e) => updateGameSetting('limbo', 'forceHit', e.target.checked)}
                    className="accent-red-500"
                  />
                  Always Hit Target
                </label>
              </div>

              {/* Keno */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎱 Keno</div>
                <div className="text-sm text-gray-300">
                  <label className="block mb-1">Extra Matches</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={gameSettings.keno?.extraMatches || 0}
                    onChange={(e) => updateGameSetting('keno', 'extraMatches', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>

              {/* Hi-Lo */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">⬆️ Hi-Lo</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.hilo?.showNextCard}
                    onChange={(e) => updateGameSetting('hilo', 'showNextCard', e.target.checked)}
                    className="accent-red-500"
                  />
                  Show Next Card
                </label>
              </div>

              {/* Baccarat */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎴 Baccarat</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.baccarat?.forcePlayerWin}
                    onChange={(e) => updateGameSetting('baccarat', 'forcePlayerWin', e.target.checked)}
                    className="accent-red-500"
                  />
                  Force Player Win
                </label>
              </div>

              {/* Sic Bo */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🎲 Sic Bo</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.sicbo?.forceTriple}
                    onChange={(e) => updateGameSetting('sicbo', 'forceTriple', e.target.checked)}
                    className="accent-red-500"
                  />
                  Force Triple
                </label>
              </div>

              {/* Plinko */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">📍 Plinko</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.plinko?.forceHighMultiplier}
                    onChange={(e) => updateGameSetting('plinko', 'forceHighMultiplier', e.target.checked)}
                    className="accent-red-500"
                  />
                  Force High Multiplier
                </label>
              </div>

              {/* Horses */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">🏇 Horses</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.horses?.alwaysWin}
                    onChange={(e) => updateGameSetting('horses', 'alwaysWin', e.target.checked)}
                    className="accent-red-500"
                  />
                  Your Horse Always Wins
                </label>
              </div>

              {/* Tic Tac Toe */}
              <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <div className="font-bold text-cyan-400 mb-2">⭕ Tic Tac Toe</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={gameSettings.tictactoe?.aiMakesStupidMoves}
                    onChange={(e) => updateGameSetting('tictactoe', 'aiMakesStupidMoves', e.target.checked)}
                    className="accent-red-500"
                  />
                  AI Makes Stupid Moves
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/50 rounded-xl p-4 border border-red-500/30">
            <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
              ⚠️ Danger Zone
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onResetStats}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white"
              >
                🗑️ Reset All Stats
              </button>
              <button
                onClick={() => {
                  onUpdateBalance(10000);
                  onResetStats();
                }}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg font-bold text-white"
              >
                🔄 Full Reset (Balance + Stats)
              </button>
              <button
                onClick={() => onUpdateBalance(0)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white"
              >
                💀 Set Balance to $0
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-red-900/30 border-t border-red-500/30 p-4 flex justify-between items-center">
          <p className="text-xs text-red-300/60">
            🎮 Press Konami Code again to close
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg font-black text-white"
            >
              💾 SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
