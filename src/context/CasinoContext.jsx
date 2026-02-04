import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import trackingEngine from '../utils/trackingEngine';

const CasinoContext = createContext(null);

// Simple encryption/decryption for export
const ENCRYPTION_KEY = 'OfflineCasino2024';

const encrypt = (data) => {
  const json = JSON.stringify(data);
  let encrypted = '';
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) + ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
};

const decrypt = (data) => {
  try {
    const decoded = atob(data);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) - ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
};

const initialState = {
  balance: 1000,
  totalBets: 0,
  totalWins: 0,
  totalLosses: 0,
  gamesPlayed: 0,
  biggestWin: 0,
  currentStreak: 0,
  bestStreak: 0,
  freeCreditsUsed: 0,
  globalBet: 50, // Auto-calculated 5% of starting balance
  lastKnownBalance: 1000, // For tracking balance increases
  history: [],
  stockExchange: {
    portfolio: {},
    orderHistory: [],
    watchlist: ['NEON', 'BOLT', 'APEX'],
    stocks: null,
    priceHistory: {},
    news: [],
    marketTrend: 0
  },
  settings: {
    soundEnabled: true,
    soundVolume: 0.5,
    fastMode: false,
    hotkeys: true,
    confirmLargeBets: true,
    winEffectsEnabled: true
  },
  adminSettings: {
    globalWinBoost: 0,
    guaranteedWins: 0,
    jackpotChance: 0,
    jackpotMultiplier: 100,
    godMode: false,
    infiniteMoney: false,
    gameSettings: {}
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'PLACE_BET': {
      if (action.amount > state.balance || action.amount <= 0) return state;
      trackingEngine.trackBetPlaced(action.game, action.amount);
      if (action.amount > state.balance * 0.5) {
        trackingEngine.trackLargeBet(action.amount, (action.amount / state.balance) * 100);
      }
      return {
        ...state,
        balance: state.balance - action.amount,
        totalBets: state.totalBets + action.amount,
        gamesPlayed: state.gamesPlayed + 1
      };
    }
    case 'ADD_WIN': {
      const profit = action.amount - action.bet;
      const isWin = profit > 0;
      const newStreak = isWin ? state.currentStreak + 1 : 0;
      const newBalance = state.balance + action.amount;

      // Track the win/loss event
      if (isWin) {
        trackingEngine.trackWin(action.game, action.amount, action.multiplier);
        if (profit > state.biggestWin) {
          trackingEngine.trackBiggestWin(profit, action.game);
        }
        if (newStreak % 5 === 0) {
          trackingEngine.trackStreakMilestone(newStreak);
        }
      } else {
        trackingEngine.trackLoss(action.game, action.amount);
      }
      trackingEngine.trackGameEnd(action.game, action.bet, action.amount, profit);

      return {
        ...state,
        balance: newBalance,
        totalWins: state.totalWins + (isWin ? profit : 0),
        biggestWin: Math.max(state.biggestWin, profit),
        currentStreak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        history: [
          {
            game: action.game,
            bet: action.bet,
            win: action.amount,
            profit,
            multiplier: action.multiplier,
            timestamp: Date.now()
          },
          ...state.history.slice(0, 99)
        ]
      };
    }
    case 'ADD_LOSS': {
      trackingEngine.trackLoss(action.game, action.amount);
      trackingEngine.trackGameEnd(action.game, action.amount, 0, -action.amount);
      return {
        ...state,
        totalLosses: state.totalLosses + action.amount,
        currentStreak: 0,
        history: [
          {
            game: action.game,
            bet: action.amount,
            win: 0,
            profit: -action.amount,
            multiplier: 0,
            timestamp: Date.now()
          },
          ...state.history.slice(0, 99)
        ]
      };
    }
    case 'ADD_FREE_CREDITS': {
      const newFreeCreditsUsed = state.freeCreditsUsed + 1;
      trackingEngine.trackAddFreeCredits(action.amount, newFreeCreditsUsed);
      trackingEngine.trackBalanceUpdate(state.balance, state.balance + action.amount, 'free_credits');
      return {
        ...state,
        balance: state.balance + action.amount,
        freeCreditsUsed: newFreeCreditsUsed
      };
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.settings }
      };
    }
    case 'SET_GLOBAL_BET': {
      return {
        ...state,
        globalBet: action.amount
      };
    }
    case 'UPDATE_LAST_KNOWN_BALANCE': {
      return {
        ...state,
        lastKnownBalance: action.balance
      };
    }
    case 'RESET_STATS': {
      return {
        ...state,
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        gamesPlayed: 0,
        biggestWin: 0,
        currentStreak: 0,
        bestStreak: 0,
        history: []
      };
    }
    case 'SET_BALANCE': {
      return {
        ...state,
        balance: action.amount
      };
    }
    case 'UPDATE_ADMIN_SETTINGS': {
      return {
        ...state,
        adminSettings: { ...state.adminSettings, ...action.settings }
      };
    }
    case 'UPDATE_STOCK_EXCHANGE': {
      return {
        ...state,
        stockExchange: { ...state.stockExchange, ...action.data }
      };
    }
    case 'LOAD_STATE': {
      return { ...state, ...action.state };
    }
    default:
      return state;
  }
}

export function CasinoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showLargeBetConfirm, setShowLargeBetConfirm] = useState(null);
  const [winEffect, setWinEffect] = useState(null);
  const [showBetUpdateSuggestion, setShowBetUpdateSuggestion] = useState(false);
  const prevBalanceRef = useRef(state.balance);
  const sessionStartRef = useRef(state.balance);

  useEffect(() => {
    const saved = localStorage.getItem('casino_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Calculate initial global bet as 5% of balance
        if (!parsed.globalBet) {
          parsed.globalBet = Math.floor(parsed.balance * 0.05) || 10;
        }
        dispatch({ type: 'LOAD_STATE', state: parsed });
        sessionStartRef.current = parsed.balance;
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
    // Track session start
    trackingEngine.trackSessionStart(state.balance);
  }, []);

  useEffect(() => {
    localStorage.setItem('casino_state', JSON.stringify({
      balance: state.balance,
      totalBets: state.totalBets,
      totalWins: state.totalWins,
      totalLosses: state.totalLosses,
      gamesPlayed: state.gamesPlayed,
      biggestWin: state.biggestWin,
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      freeCreditsUsed: state.freeCreditsUsed,
      globalBet: state.globalBet,
      lastKnownBalance: state.lastKnownBalance,
      history: state.history.slice(0, 50),
      stockExchange: state.stockExchange,
      settings: state.settings,
      adminSettings: state.adminSettings
    }));
  }, [state]);

  // Check for balance increase (90%+ increase suggests bet update)
  useEffect(() => {
    if (state.lastKnownBalance > 0) {
      const increase = (state.balance - state.lastKnownBalance) / state.lastKnownBalance;
      if (increase >= 0.9 && state.balance > state.lastKnownBalance) {
        setShowBetUpdateSuggestion(true);
      }
    }
  }, [state.balance, state.lastKnownBalance]);

  // Global stock price ticker - updates prices even when not on Stock Exchange
  useEffect(() => {
    if (!state.stockExchange?.stocks || state.stockExchange.stocks.length === 0) return;

    const tickInterval = setInterval(() => {
      const updatedStocks = state.stockExchange.stocks.map(stock => {
        // Random walk based on volatility
        const randomWalk = (Math.random() - 0.5) * 2 * stock.volatility;
        const trendEffect = stock.trend || 0;
        const marketEffect = state.stockExchange.marketTrend || 0;
        const priceChange = 1 + marketEffect + randomWalk + trendEffect;
        const newPrice = Math.max(0.01, stock.price * priceChange);
        return { ...stock, price: newPrice };
      });

      // Update market trend
      const newMarketTrend = Math.max(-0.01, Math.min(0.01,
        (state.stockExchange.marketTrend || 0) + (Math.random() - 0.5) * 0.002
      ));

      dispatch({
        type: 'UPDATE_STOCK_EXCHANGE',
        data: {
          stocks: updatedStocks,
          marketTrend: newMarketTrend
        }
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [state.stockExchange?.stocks?.length]); // Only re-create when stocks array exists/changes size

  const placeBet = useCallback((amount, game) => {
    if (amount > state.balance || amount <= 0) return false;

    // Check for large bet confirmation (over 50% balance)
    if (state.settings.confirmLargeBets && amount > state.balance * 0.5) {
      return new Promise((resolve) => {
        setShowLargeBetConfirm({ amount, game, resolve });
      });
    }

    dispatch({ type: 'PLACE_BET', amount, game });
    return true;
  }, [state.balance, state.settings.confirmLargeBets]);

  const confirmLargeBet = useCallback(() => {
    if (showLargeBetConfirm) {
      dispatch({ type: 'PLACE_BET', amount: showLargeBetConfirm.amount, game: showLargeBetConfirm.game });
      showLargeBetConfirm.resolve?.(true);
      setShowLargeBetConfirm(null);
      return true;
    }
    return false;
  }, [showLargeBetConfirm]);

  const cancelLargeBet = useCallback(() => {
    if (showLargeBetConfirm) {
      showLargeBetConfirm.resolve?.(false);
    }
    setShowLargeBetConfirm(null);
  }, [showLargeBetConfirm]);

  const addWin = useCallback((amount, bet, game, multiplier) => {
    dispatch({ type: 'ADD_WIN', amount, bet, game, multiplier });

    // Trigger win effects for significant wins
    const profit = amount - bet;
    if (state.settings.winEffectsEnabled && profit > 0) {
      setWinEffect({ profit, multiplier, game });
    }
  }, [state.settings.winEffectsEnabled]);

  const clearWinEffect = useCallback(() => {
    setWinEffect(null);
  }, []);

  const addLoss = (amount, game) => {
    dispatch({ type: 'ADD_LOSS', amount, game });
  };

  const addFreeCredits = (amount = 1000) => {
    if (state.freeCreditsUsed >= 3) return false;
    dispatch({ type: 'ADD_FREE_CREDITS', amount });
    return true;
  };

  const updateSettings = (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  };

  const setGlobalBet = (amount) => {
    dispatch({ type: 'SET_GLOBAL_BET', amount });
  };

  const updateLastKnownBalance = () => {
    dispatch({ type: 'UPDATE_LAST_KNOWN_BALANCE', balance: state.balance });
    setShowBetUpdateSuggestion(false);
  };

  const suggestNewBet = () => {
    const newBet = Math.floor(state.balance * 0.05);
    setGlobalBet(newBet);
    updateLastKnownBalance();
  };

  const resetStats = () => {
    dispatch({ type: 'RESET_STATS' });
  };

  const setBalance = (amount) => {
    dispatch({ type: 'SET_BALANCE', amount });
  };

  const updateAdminSettings = (settings) => {
    dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings });
  };

  const updateStockExchange = (data) => {
    dispatch({ type: 'UPDATE_STOCK_EXCHANGE', data });
  };

  const exportProgress = () => {
    const exportData = {
      balance: state.balance,
      totalBets: state.totalBets,
      totalWins: state.totalWins,
      totalLosses: state.totalLosses,
      gamesPlayed: state.gamesPlayed,
      biggestWin: state.biggestWin,
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      freeCreditsUsed: state.freeCreditsUsed,
      globalBet: state.globalBet,
      history: state.history.slice(0, 50),
      stockExchange: state.stockExchange,
      settings: state.settings,
      exportedAt: Date.now()
    };
    trackingEngine.trackExportProgress();
    return encrypt(exportData);
  };

  const importProgress = (encryptedData) => {
    const data = decrypt(encryptedData);
    if (data && typeof data === 'object' && 'balance' in data) {
      dispatch({ type: 'LOAD_STATE', state: data });
      trackingEngine.trackImportProgress(true);
      return true;
    }
    trackingEngine.trackImportProgress(false);
    return false;
  };

  return (
    <CasinoContext.Provider value={{
      state,
      placeBet,
      addWin,
      addLoss,
      addFreeCredits,
      updateSettings,
      setGlobalBet,
      resetStats,
      setBalance,
      updateAdminSettings,
      updateStockExchange,
      exportProgress,
      importProgress,
      showLargeBetConfirm,
      confirmLargeBet,
      cancelLargeBet,
      winEffect,
      clearWinEffect,
      showBetUpdateSuggestion,
      suggestNewBet,
      updateLastKnownBalance
    }}>
      {children}
    </CasinoContext.Provider>
  );
}

export function useCasino() {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error('useCasino must be used within CasinoProvider');
  }
  return context;
}

export default CasinoContext;
